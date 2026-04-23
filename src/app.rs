use std::collections::HashMap;
use tokio::fs::File;
use tokio::io::{self, AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;
use tokio::time::{self, Duration};

#[derive(Clone, Debug)]
pub struct LogEntry {
    pub line: String,
    pub line_number: usize,
    pub file_path: String,
    pub file_index: usize,
    pub is_json: bool,
    pub trace_id: Option<String>,
}

pub struct FileState {
    pub path: String,
    pub display_name: String,
    pub line_count: usize,
    pub color_index: usize,
}

pub enum InputMode {
    Normal,
    Search,
    FilePicker,
}

pub struct FilePickerState {
    pub query: String,
    pub filtered: Vec<usize>,
    pub selected: usize,
}

impl FilePickerState {
    pub fn new(file_count: usize) -> Self {
        FilePickerState {
            query: String::new(),
            filtered: (0..file_count).collect(),
            selected: 0,
        }
    }

    pub fn update_filter(&mut self, files: &[FileState]) {
        let q = self.query.to_lowercase();
        self.filtered = files
            .iter()
            .enumerate()
            .filter(|(_, f)| {
                if q.is_empty() {
                    true
                } else {
                    fuzzy_match(&f.display_name.to_lowercase(), &q)
                }
            })
            .map(|(i, _)| i)
            .collect();
        if self.selected >= self.filtered.len() {
            self.selected = self.filtered.len().saturating_sub(1);
        }
    }

    pub fn move_up(&mut self) {
        self.selected = self.selected.saturating_sub(1);
    }

    pub fn move_down(&mut self) {
        if !self.filtered.is_empty() {
            self.selected = (self.selected + 1).min(self.filtered.len() - 1);
        }
    }

    pub fn selected_file_index(&self) -> Option<usize> {
        self.filtered.get(self.selected).copied()
    }
}

fn fuzzy_match(haystack: &str, needle: &str) -> bool {
    let mut needle_chars = needle.chars().peekable();
    for c in haystack.chars() {
        if let Some(&nc) = needle_chars.peek() {
            if c == nc {
                needle_chars.next();
            }
        }
    }
    needle_chars.peek().is_none()
}

pub struct App {
    pub all_lines: Vec<LogEntry>,
    pub file_lines: HashMap<usize, Vec<usize>>,
    pub files: Vec<FileState>,
    pub file_map: HashMap<String, usize>,

    pub current_tab: usize,
    pub scroll_offset: usize,
    pub follow: bool,
    pub input_mode: InputMode,

    pub search_query: String,
    pub search_results: Vec<usize>,
    pub search_cursor: usize,

    pub expanded_lines: HashMap<usize, bool>,
    pub expand_all_json: bool,

    pub viewport_height: usize,
    pub viewport_width: usize,
    pub expanded_heights: HashMap<usize, usize>,

    pub cursor: usize,
    pub file_picker: Option<FilePickerState>,
    pub show_help: bool,
    pub tick: usize,
    pub strip_ansi: bool,

    pub trace_filter: Option<String>,
    pub trace_indices: Vec<usize>,
}

impl App {
    pub fn new(files: Vec<String>) -> Self {
        let common_prefix = find_common_prefix(&files);
        let mut file_states = Vec::new();
        let mut file_map = HashMap::new();

        for (i, path) in files.iter().enumerate() {
            let display_name = if common_prefix.is_empty() {
                path.clone()
            } else {
                path[common_prefix.len()..].to_string()
            };
            file_map.insert(path.clone(), i);
            file_states.push(FileState {
                path: path.clone(),
                display_name,
                line_count: 0,
                color_index: i,
            });
        }

        App {
            all_lines: Vec::new(),
            file_lines: HashMap::new(),
            files: file_states,
            file_map,
            current_tab: 0,
            scroll_offset: 0,
            follow: true,
            input_mode: InputMode::Normal,
            search_query: String::new(),
            search_results: Vec::new(),
            search_cursor: 0,
            expanded_lines: HashMap::new(),
            expand_all_json: false,
            viewport_height: 24,
            viewport_width: 80,
            expanded_heights: HashMap::new(),
            cursor: 0,
            file_picker: None,
            show_help: false,
            tick: 0,
            strip_ansi: true,
            trace_filter: None,
            trace_indices: Vec::new(),
        }
    }

    pub fn add_entry(&mut self, entry: LogEntry) {
        let idx = self.all_lines.len();
        let file_idx = entry.file_index;

        if file_idx < self.files.len() {
            self.files[file_idx].line_count += 1;
        }

        self.file_lines.entry(file_idx).or_default().push(idx);
        self.all_lines.push(entry);

        if let Some(ref tf) = self.trace_filter {
            if let Some(tid) = &self.all_lines[idx].trace_id {
                if tid == tf {
                    self.trace_indices.push(idx);
                }
            }
        }

        if !self.search_query.is_empty() {
            let include = if self.trace_filter.is_some() {
                self.all_lines[idx].trace_id.as_deref() == self.trace_filter.as_deref()
            } else {
                self.current_tab == 0 || self.current_tab - 1 == file_idx
            };
            if include {
                if let Ok(re) = regex::Regex::new(&format!("(?i){}", &self.search_query)) {
                    if re.is_match(&self.all_lines[idx].line) {
                        self.search_results.push(idx);
                    }
                }
            }
        }

        if self.follow {
            self.cursor = self.visible_count().saturating_sub(1);
            self.scroll_to_bottom();
        }
    }

    pub fn json_indent_len(&self) -> usize {
        if self.current_tab == 0 || self.trace_filter.is_some() { 19 } else { 8 }
    }

    pub fn visible_count(&self) -> usize {
        if self.trace_filter.is_some() {
            return self.trace_indices.len();
        }
        if self.current_tab == 0 {
            self.all_lines.len()
        } else {
            self.file_lines
                .get(&(self.current_tab - 1))
                .map_or(0, |v| v.len())
        }
    }

    pub fn get_line_index(&self, visible_idx: usize) -> Option<usize> {
        if self.trace_filter.is_some() {
            return self.trace_indices.get(visible_idx).copied();
        }
        if self.current_tab == 0 {
            if visible_idx < self.all_lines.len() {
                Some(visible_idx)
            } else {
                None
            }
        } else {
            self.file_lines
                .get(&(self.current_tab - 1))
                .and_then(|v| v.get(visible_idx).copied())
        }
    }

    pub fn total_display_lines(&self) -> usize {
        let count = self.visible_count();
        let mut total = 0;
        for i in 0..count {
            if let Some(idx) = self.get_line_index(i) {
                total += self.line_display_height(idx);
            } else {
                total += 1;
            }
        }
        total
    }

    pub fn line_display_height(&self, line_idx: usize) -> usize {
        if let Some(&h) = self.expanded_heights.get(&line_idx) {
            if self.is_expanded(line_idx) {
                return h;
            }
        }
        1
    }

    pub fn is_expanded(&self, line_idx: usize) -> bool {
        if self.expand_all_json {
            if let Some(entry) = self.all_lines.get(line_idx) {
                return entry.is_json;
            }
        }
        self.expanded_lines.get(&line_idx).copied().unwrap_or(false)
    }

    pub fn toggle_expand(&mut self, line_idx: usize) {
        let current = self.expanded_lines.get(&line_idx).copied().unwrap_or(false);
        self.expanded_lines.insert(line_idx, !current);
    }

    pub fn scroll_to_bottom(&mut self) {
        let total = self.total_display_lines();
        if total > self.viewport_height {
            self.scroll_offset = total - self.viewport_height;
        } else {
            self.scroll_offset = 0;
        }
    }

    pub fn cursor_up(&mut self, n: usize) {
        self.follow = false;
        self.cursor = self.cursor.saturating_sub(n);
        self.ensure_cursor_visible();
    }

    pub fn cursor_down(&mut self, n: usize) {
        let max = self.visible_count().saturating_sub(1);
        self.cursor = (self.cursor + n).min(max);
        self.ensure_cursor_visible();
        let total = self.total_display_lines();
        let scroll_max = total.saturating_sub(self.viewport_height);
        if self.scroll_offset >= scroll_max && self.cursor >= max {
            self.follow = true;
        }
    }

    pub fn cursor_to_top(&mut self) {
        self.follow = false;
        self.cursor = 0;
        self.scroll_offset = 0;
    }

    pub fn cursor_to_bottom(&mut self) {
        let max = self.visible_count().saturating_sub(1);
        self.cursor = max;
        self.follow = true;
        self.scroll_to_bottom();
    }

    fn ensure_cursor_visible(&mut self) {
        let cursor_display_row = self.cursor_display_row();
        if cursor_display_row < self.scroll_offset {
            self.scroll_offset = cursor_display_row;
        }
        let cursor_h = self
            .get_line_index(self.cursor)
            .map(|idx| self.line_display_height(idx))
            .unwrap_or(1);
        if cursor_display_row + cursor_h > self.scroll_offset + self.viewport_height {
            self.scroll_offset = (cursor_display_row + cursor_h).saturating_sub(self.viewport_height);
        }
    }

    fn cursor_display_row(&self) -> usize {
        let mut row = 0;
        for i in 0..self.cursor.min(self.visible_count()) {
            if let Some(idx) = self.get_line_index(i) {
                row += self.line_display_height(idx);
            } else {
                row += 1;
            }
        }
        row
    }

    pub fn cursor_line_index(&self) -> Option<usize> {
        self.get_line_index(self.cursor)
    }

    pub fn ensure_expanded_visible(&mut self) {
        let cursor_row = self.cursor_display_row();
        let cursor_h = self
            .cursor_line_index()
            .map(|idx| self.line_display_height(idx))
            .unwrap_or(1);
        let bottom = cursor_row + cursor_h;
        if bottom <= self.scroll_offset + self.viewport_height {
            return;
        }
        if cursor_h >= self.viewport_height {
            self.scroll_offset = cursor_row;
        } else {
            self.scroll_offset = bottom.saturating_sub(self.viewport_height);
        }
    }

    pub fn enter_trace_mode(&mut self) {
        let idx = match self.cursor_line_index() {
            Some(i) => i,
            None => return,
        };
        let tid = match self.all_lines.get(idx).and_then(|e| e.trace_id.clone()) {
            Some(t) => t,
            None => return,
        };
        self.trace_filter = Some(tid.clone());
        self.trace_indices = self
            .all_lines
            .iter()
            .enumerate()
            .filter_map(|(i, e)| {
                if e.trace_id.as_deref() == Some(tid.as_str()) {
                    Some(i)
                } else {
                    None
                }
            })
            .collect();
        self.current_tab = 0;
        self.cursor = 0;
        self.scroll_offset = 0;
        self.run_search();
        if self.follow {
            self.cursor = self.visible_count().saturating_sub(1);
            self.scroll_to_bottom();
        }
    }

    pub fn exit_trace_mode(&mut self) {
        self.trace_filter = None;
        self.trace_indices.clear();
        self.cursor = 0;
        self.scroll_offset = 0;
        self.run_search();
        if self.follow {
            self.cursor = self.visible_count().saturating_sub(1);
            self.scroll_to_bottom();
        }
    }

    pub fn run_search(&mut self) {
        self.search_results.clear();
        self.search_cursor = 0;
        if self.search_query.is_empty() {
            return;
        }
        let re = match regex::Regex::new(&format!("(?i){}", &self.search_query)) {
            Ok(r) => r,
            Err(_) => return,
        };
        let count = self.visible_count();
        for i in 0..count {
            if let Some(idx) = self.get_line_index(i) {
                if re.is_match(&self.all_lines[idx].line) {
                    self.search_results.push(idx);
                }
            }
        }
    }

    pub fn next_match(&mut self) {
        if self.search_results.is_empty() {
            return;
        }
        self.search_cursor = (self.search_cursor + 1) % self.search_results.len();
        self.jump_to_search_result();
    }

    pub fn prev_match(&mut self) {
        if self.search_results.is_empty() {
            return;
        }
        if self.search_cursor == 0 {
            self.search_cursor = self.search_results.len() - 1;
        } else {
            self.search_cursor -= 1;
        }
        self.jump_to_search_result();
    }

    fn jump_to_search_result(&mut self) {
        if let Some(&line_idx) = self.search_results.get(self.search_cursor) {
            self.follow = false;
            let mut display_offset: usize = 0;
            let count = self.visible_count();
            for i in 0..count {
                if let Some(idx) = self.get_line_index(i) {
                    if idx == line_idx {
                        self.cursor = i;
                        let center = self.viewport_height / 2;
                        self.scroll_offset = display_offset.saturating_sub(center);
                        return;
                    }
                    display_offset += self.line_display_height(idx);
                }
            }
        }
    }

}

fn find_common_prefix(paths: &[String]) -> String {
    if paths.len() <= 1 {
        return String::new();
    }
    let first = &paths[0];
    let mut prefix_len = 0;
    for (i, c) in first.char_indices() {
        if paths.iter().all(|p| p.get(i..i + c.len_utf8()) == Some(&first[i..i + c.len_utf8()])) {
            prefix_len = i + c.len_utf8();
        } else {
            break;
        }
    }
    let prefix = &first[..prefix_len];
    if let Some(last_slash) = prefix.rfind('/') {
        first[..last_slash + 1].to_string()
    } else {
        String::new()
    }
}

fn extract_trace_id(raw: &str) -> Option<String> {
    let value: serde_json::Value = serde_json::from_str(raw).ok()?;
    let map = value.as_object()?;
    for (k, v) in map {
        let kl = k.to_lowercase();
        if kl == "traceid" || kl == "trace_id" {
            match v {
                serde_json::Value::String(s) if !s.is_empty() => return Some(s.clone()),
                serde_json::Value::Number(n) => return Some(n.to_string()),
                _ => {}
            }
        }
    }
    None
}

pub async fn tail_file(path: String, file_index: usize, tx: mpsc::Sender<LogEntry>) -> io::Result<()> {
    let file = File::open(&path).await?;
    let reader = BufReader::new(file);
    let mut lines = reader.lines();
    let mut interval = time::interval(Duration::from_millis(300));
    let mut line_number = 0usize;

    loop {
        tokio::select! {
            line = lines.next_line() => {
                match line {
                    Ok(Some(text)) => {
                        line_number += 1;
                        let stripped = crate::highlight::strip_ansi(&text);
                        let trimmed = stripped.trim_start();
                        let is_json = trimmed.starts_with('{');
                        let trace_id = if is_json { extract_trace_id(trimmed) } else { None };
                        let entry = LogEntry {
                            line: text,
                            line_number,
                            file_path: path.clone(),
                            file_index,
                            is_json,
                            trace_id,
                        };
                        if tx.send(entry).await.is_err() {
                            break;
                        }
                    },
                    Ok(None) => {
                        interval.tick().await;
                    },
                    Err(e) => {
                        eprintln!("Error reading line: {}", e);
                        break;
                    }
                }
            },
            _ = interval.tick() => {},
        }
    }

    Ok(())
}
