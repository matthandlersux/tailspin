use crossterm::event::{KeyCode, KeyEvent, KeyModifiers, MouseButton, MouseEvent, MouseEventKind};

use crate::app::{App, FilePickerState, InputMode};

pub fn handle_key(app: &mut App, key: KeyEvent) -> bool {
    match &app.input_mode {
        InputMode::Search => handle_search_key(app, key),
        InputMode::Normal => handle_normal_key(app, key),
        InputMode::FilePicker => handle_file_picker_key(app, key),
    }
}

fn handle_search_key(app: &mut App, key: KeyEvent) -> bool {
    match key.code {
        KeyCode::Esc => {
            app.input_mode = InputMode::Normal;
        }
        KeyCode::Enter => {
            app.run_search();
            app.input_mode = InputMode::Normal;
            if !app.search_results.is_empty() {
                app.search_cursor = 0;
                app.next_match();
            }
        }
        KeyCode::Char(c) => {
            app.search_query.push(c);
        }
        KeyCode::Backspace => {
            app.search_query.pop();
        }
        _ => {}
    }
    false
}

fn handle_file_picker_key(app: &mut App, key: KeyEvent) -> bool {
    match key.code {
        KeyCode::Esc => {
            app.file_picker = None;
            app.input_mode = InputMode::Normal;
        }
        KeyCode::Enter => {
            if let Some(ref picker) = app.file_picker {
                if let Some(file_idx) = picker.selected_file_index() {
                    app.current_tab = file_idx + 1;
                    app.cursor = 0;
                    app.scroll_offset = 0;
                    if app.follow {
                        app.scroll_to_bottom();
                    }
                }
            }
            app.file_picker = None;
            app.input_mode = InputMode::Normal;
        }
        KeyCode::Up => {
            if let Some(ref mut picker) = app.file_picker {
                picker.move_up();
            }
        }
        KeyCode::Down => {
            if let Some(ref mut picker) = app.file_picker {
                picker.move_down();
            }
        }
        KeyCode::Tab => {
            if let Some(ref mut picker) = app.file_picker {
                picker.move_down();
            }
        }
        KeyCode::BackTab => {
            if let Some(ref mut picker) = app.file_picker {
                picker.move_up();
            }
        }
        KeyCode::Char(c) => {
            if let Some(ref mut picker) = app.file_picker {
                picker.query.push(c);
            }
            let files_snapshot: Vec<_> = app.files.iter().map(|f| crate::app::FileState {
                path: f.path.clone(),
                display_name: f.display_name.clone(),
                line_count: f.line_count,
                color_index: f.color_index,
            }).collect();
            if let Some(ref mut picker) = app.file_picker {
                picker.update_filter(&files_snapshot);
            }
        }
        KeyCode::Backspace => {
            if let Some(ref mut picker) = app.file_picker {
                picker.query.pop();
            }
            let files_snapshot: Vec<_> = app.files.iter().map(|f| crate::app::FileState {
                path: f.path.clone(),
                display_name: f.display_name.clone(),
                line_count: f.line_count,
                color_index: f.color_index,
            }).collect();
            if let Some(ref mut picker) = app.file_picker {
                picker.update_filter(&files_snapshot);
            }
        }
        _ => {}
    }
    false
}

fn handle_normal_key(app: &mut App, key: KeyEvent) -> bool {
    if app.show_help {
        app.show_help = false;
        return false;
    }

    if key.modifiers.contains(KeyModifiers::CONTROL) {
        match key.code {
            KeyCode::Char('t') => {
                open_file_picker(app);
                return false;
            }
            _ => {}
        }
    }

    match key.code {
        KeyCode::Char('q') => return true,

        KeyCode::Char('/') => {
            app.input_mode = InputMode::Search;
            app.search_query.clear();
            app.search_results.clear();
        }

        KeyCode::Char('@') => {
            open_file_picker(app);
        }

        KeyCode::Char('n') => app.next_match(),
        KeyCode::Char('p') => app.prev_match(),

        KeyCode::Char('j') | KeyCode::Down => app.cursor_down(1),
        KeyCode::Char('k') | KeyCode::Up => app.cursor_up(1),
        KeyCode::PageDown => app.cursor_down(app.viewport_height),
        KeyCode::PageUp => app.cursor_up(app.viewport_height),

        KeyCode::Char('G') | KeyCode::End => app.cursor_to_bottom(),
        KeyCode::Char('g') | KeyCode::Home => app.cursor_to_top(),

        KeyCode::Char('f') => {
            app.follow = !app.follow;
            if app.follow {
                app.cursor_to_bottom();
            }
        }

        KeyCode::Tab => {
            let total_tabs = app.files.len() + 1;
            app.current_tab = (app.current_tab + 1) % total_tabs;
            app.cursor = 0;
            app.scroll_offset = 0;
            if app.follow {
                app.cursor = app.visible_count().saturating_sub(1);
                app.scroll_to_bottom();
            }
        }
        KeyCode::BackTab => {
            let total_tabs = app.files.len() + 1;
            if app.current_tab == 0 {
                app.current_tab = total_tabs - 1;
            } else {
                app.current_tab -= 1;
            }
            app.cursor = 0;
            app.scroll_offset = 0;
            if app.follow {
                app.cursor = app.visible_count().saturating_sub(1);
                app.scroll_to_bottom();
            }
        }

        KeyCode::Char('0') | KeyCode::Char('`') => {
            app.current_tab = 0;
            app.cursor = 0;
            app.scroll_offset = 0;
            if app.follow {
                app.cursor = app.visible_count().saturating_sub(1);
                app.scroll_to_bottom();
            }
        }

        KeyCode::Char(c) if c.is_ascii_digit() && c != '0' => {
            let idx = (c as u8 - b'0') as usize;
            if idx <= app.files.len() {
                app.current_tab = idx;
                app.cursor = 0;
                app.scroll_offset = 0;
                if app.follow {
                    app.cursor = app.visible_count().saturating_sub(1);
                    app.scroll_to_bottom();
                }
            }
        }

        KeyCode::Enter => {
            if let Some(line_idx) = app.cursor_line_index() {
                if let Some(entry) = app.all_lines.get(line_idx) {
                    if entry.is_json {
                        let h = crate::json_viewer::json_line_count(&entry.line);
                        app.expanded_heights.insert(line_idx, h);
                        let was_expanded = app.is_expanded(line_idx);
                        app.toggle_expand(line_idx);
                        if !was_expanded {
                            app.ensure_expanded_visible();
                        }
                    }
                }
            }
        }

        KeyCode::Char('?') => {
            app.show_help = !app.show_help;
        }

        KeyCode::Char('*') => {
            app.yank_line_to_search();
        }

        KeyCode::Char('e') => {
            app.expand_all_json = !app.expand_all_json;
            if app.expand_all_json {
                for (i, entry) in app.all_lines.iter().enumerate() {
                    if entry.is_json {
                        let h = crate::json_viewer::json_line_count(&entry.line);
                        app.expanded_heights.insert(i, h);
                    }
                }
            }
            if app.follow {
                app.scroll_to_bottom();
            }
        }

        KeyCode::Esc => {
            if !app.search_query.is_empty() {
                app.search_query.clear();
                app.search_results.clear();
            }
        }

        _ => {}
    }
    false
}

fn open_file_picker(app: &mut App) {
    let mut picker = FilePickerState::new(app.files.len());
    picker.update_filter(&app.files);
    app.file_picker = Some(picker);
    app.input_mode = InputMode::FilePicker;
}

pub fn handle_mouse(app: &mut App, mouse: MouseEvent) {
    match mouse.kind {
        MouseEventKind::ScrollUp => {
            app.cursor_up(3);
        }
        MouseEventKind::ScrollDown => {
            app.cursor_down(3);
        }
        MouseEventKind::Down(MouseButton::Left) => {
            let row = mouse.row as usize;
            if row == 0 || row > app.viewport_height {
                return;
            }
            let click_row = row - 1;
            let target_display_row = app.scroll_offset + click_row;

            let count = app.visible_count();
            let mut display_row = 0;
            for i in 0..count {
                if let Some(idx) = app.get_line_index(i) {
                    let h = app.line_display_height(idx);
                    if target_display_row >= display_row && target_display_row < display_row + h {
                        app.cursor = i;
                        app.follow = false;

                        if mouse.column < 2 {
                            if let Some(entry) = app.all_lines.get(idx) {
                                if entry.is_json {
                                    let line_h = crate::json_viewer::json_line_count(&entry.line);
                                    app.expanded_heights.insert(idx, line_h);
                                    app.toggle_expand(idx);
                                }
                            }
                        }
                        return;
                    }
                    display_row += h;
                }
            }
        }
        _ => {}
    }
}
