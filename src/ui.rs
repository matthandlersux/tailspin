use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Clear, Paragraph};
use ratatui::Frame;
use regex::Regex;

use crate::app::{App, InputMode};
use crate::highlight;
use crate::json_viewer;
use crate::tabs;

pub fn render(f: &mut Frame, app: &mut App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Min(1),
            Constraint::Length(1),
            Constraint::Length(1),
        ])
        .split(f.area());

    app.viewport_height = chunks[1].height as usize;
    app.viewport_width = chunks[1].width as usize;
    app.tick = app.tick.wrapping_add(1);

    render_status_bar(f, app, chunks[0]);
    render_log_view(f, app, chunks[1]);
    render_tab_bar(f, app, chunks[2]);
    render_bottom_bar(f, app, chunks[3]);

    if matches!(app.input_mode, InputMode::FilePicker) {
        render_file_picker(f, app);
    }
    if app.show_help {
        render_help(f);
    }
}

fn render_status_bar(f: &mut Frame, app: &App, area: Rect) {
    let follow_indicator = if app.follow { "FOLLOW" } else { "SCROLL" };
    let follow_color = if app.follow { Color::Green } else { Color::DarkGray };
    let total = app.visible_count();

    let (view_label, view_style) = if app.current_tab == 0 {
        (
            " All files ".to_string(),
            Style::default().fg(Color::White).add_modifier(Modifier::BOLD),
        )
    } else {
        let file = app.files.get(app.current_tab - 1);
        let name = file.map(|f| f.display_name.clone()).unwrap_or_default();
        let color = file.map(|f| tabs::file_color(f.color_index)).unwrap_or(Color::White);
        (
            format!(" {} ", name),
            Style::default().fg(Color::Black).bg(color).add_modifier(Modifier::BOLD),
        )
    };

    let logo_spans = animated_logo(app.tick);

    let mut spans = Vec::new();
    spans.push(Span::raw(" "));
    spans.extend(logo_spans);
    spans.push(Span::styled(" tailspin ", Style::default().fg(Color::White).add_modifier(Modifier::BOLD)));
    spans.push(Span::styled("│ ", Style::default().fg(Color::DarkGray)));
    spans.push(Span::styled(view_label, view_style));
    spans.push(Span::styled(" │ ", Style::default().fg(Color::DarkGray)));
    spans.push(Span::styled(follow_indicator, Style::default().fg(follow_color).add_modifier(Modifier::BOLD)));
    spans.push(Span::styled(" │ ", Style::default().fg(Color::DarkGray)));
    spans.push(Span::styled(format!("{} lines", total), Style::default().fg(Color::White)));
    spans.push(Span::styled(" │ ", Style::default().fg(Color::DarkGray)));
    let json_label = if app.expand_all_json { "JSON:ON" } else { "JSON:OFF" };
    let json_color = if app.expand_all_json { Color::Yellow } else { Color::DarkGray };
    spans.push(Span::styled(json_label, Style::default().fg(json_color)));

    if !app.search_results.is_empty() {
        spans.push(Span::styled(" │ ", Style::default().fg(Color::DarkGray)));
        spans.push(Span::styled(
            format!("{}/{} matches", app.search_cursor + 1, app.search_results.len()),
            Style::default().fg(Color::Yellow),
        ));
    }

    let line = Line::from(spans);
    let p = Paragraph::new(line).style(Style::default().bg(Color::Rgb(30, 30, 30)));
    f.render_widget(p, area);
}

fn pad_line_bg<'a>(line: Line<'a>, width: usize, bg: Color) -> Line<'a> {
    if matches!(bg, Color::Reset) {
        return line.style(Style::default().bg(bg));
    }
    let text_w: usize = line.spans.iter().map(|s| s.width()).sum();
    let mut spans = line.spans;
    if text_w < width {
        spans.push(Span::styled(
            " ".repeat(width - text_w),
            Style::default().bg(bg),
        ));
    }
    Line::from(spans).style(Style::default().bg(bg))
}

fn render_log_view(f: &mut Frame, app: &App, area: Rect) {
    f.render_widget(Clear, area);

    let search_re = if !app.search_query.is_empty() {
        Regex::new(&format!("(?i){}", &app.search_query)).ok()
    } else {
        None
    };

    let viewport_height = area.height as usize;
    let viewport_width = area.width as usize;
    let mut display_lines: Vec<Line> = Vec::new();
    let show_file_prefix = app.current_tab == 0;

    let count = app.visible_count();
    let mut display_row = 0;
    let cursor_bg = Color::Rgb(55, 55, 90);

    let indent_prefix = if show_file_prefix {
        "                 "
    } else {
        "      "
    };

    for i in 0..count {
        let line_idx = match app.get_line_index(i) {
            Some(idx) => idx,
            None => continue,
        };
        let entry = &app.all_lines[line_idx];
        let h = app.line_display_height(line_idx);
        let is_cursor = i == app.cursor;

        if display_row + h <= app.scroll_offset {
            display_row += h;
            continue;
        }

        if display_row >= app.scroll_offset + viewport_height {
            break;
        }

        let file_color = tabs::file_color(entry.file_index);
        let file_name = app
            .files
            .get(entry.file_index)
            .map(|f| f.display_name.as_str())
            .unwrap_or("?");

        let is_search_match = !app.search_results.is_empty()
            && app.search_results.binary_search(&line_idx).is_ok();

        let row_bg = if is_cursor {
            cursor_bg
        } else if is_search_match {
            Color::Rgb(50, 50, 0)
        } else {
            Color::Reset
        };

        if app.is_expanded(line_idx) && !entry.is_json {
            let raw = &entry.line;
            let text: String = if app.strip_ansi && raw.contains('\x1b') {
                highlight::strip_ansi(raw)
            } else {
                raw.clone()
            };
            let indent_len = indent_prefix.chars().count();
            let avail = viewport_width.saturating_sub(indent_len).max(1);

            let mut chunks: Vec<String> = Vec::new();
            let mut iter = text.chars();
            loop {
                let chunk: String = iter.by_ref().take(avail).collect();
                if chunk.is_empty() {
                    break;
                }
                chunks.push(chunk);
            }
            if chunks.is_empty() {
                chunks.push(String::new());
            }

            for (i, chunk) in chunks.iter().enumerate() {
                let row = display_row + i;
                if row < app.scroll_offset {
                    continue;
                }
                if row >= app.scroll_offset + viewport_height {
                    break;
                }

                let mut spans: Vec<Span<'static>> = Vec::new();
                if i == 0 {
                    if is_cursor {
                        spans.push(Span::styled("▌", Style::default().fg(Color::White)));
                        spans.push(Span::raw(" "));
                    } else {
                        spans.push(Span::raw("  "));
                    }
                    if show_file_prefix {
                        spans.push(Span::styled("● ", Style::default().fg(file_color)));
                        spans.push(Span::styled(
                            format!("{:<10} ", file_name),
                            Style::default().fg(file_color),
                        ));
                    }
                } else {
                    spans.push(Span::raw(indent_prefix.to_string()));
                }

                let hl = highlight::highlight_line(chunk, search_re.as_ref());
                spans.extend(hl.spans);

                display_lines.push(pad_line_bg(Line::from(spans), viewport_width, row_bg));
            }
        } else if app.is_expanded(line_idx) && entry.is_json {
            let json_lines = json_viewer::format_json_lines(&entry.line, indent_prefix, app.viewport_width);

            let header_row = display_row;
            if header_row >= app.scroll_offset && header_row < app.scroll_offset + viewport_height {
                let mut spans = Vec::new();
                if is_cursor {
                    spans.push(Span::styled("▌", Style::default().fg(Color::White)));
                } else {
                    spans.push(Span::raw(" "));
                }
                spans.push(Span::styled("▼", Style::default().fg(Color::Yellow)));
                spans.push(Span::raw(" "));
                if show_file_prefix {
                    spans.push(Span::styled("● ", Style::default().fg(file_color)));
                    spans.push(Span::styled(
                        format!("{:<10} ", file_name),
                        Style::default().fg(file_color),
                    ));
                } else {
                    spans.push(Span::raw("    "));
                }
                spans.push(Span::styled("{", Style::default().fg(Color::Yellow)));
                display_lines.push(pad_line_bg(Line::from(spans), viewport_width, row_bg));
            }

            let field_count = json_lines.len();
            for (j, json_line) in json_lines.into_iter().enumerate() {
                let row = header_row + 1 + j;
                if row < app.scroll_offset {
                    continue;
                }
                if row >= app.scroll_offset + viewport_height {
                    break;
                }
                let hl = if let Some(re) = &search_re {
                    highlight::apply_search_highlight(json_line, re)
                } else {
                    json_line
                };
                display_lines.push(pad_line_bg(hl, viewport_width, row_bg));
            }

            let closing_row = header_row + 1 + field_count;
            if closing_row >= app.scroll_offset && closing_row < app.scroll_offset + viewport_height {
                let mut spans = Vec::new();
                if show_file_prefix {
                    spans.push(Span::raw("               "));
                } else {
                    spans.push(Span::raw("      "));
                }
                spans.push(Span::styled("}", Style::default().fg(Color::Yellow)));
                display_lines.push(pad_line_bg(Line::from(spans), viewport_width, row_bg));
            }
        } else {
            if display_row >= app.scroll_offset {
                let mut spans = Vec::new();

                if is_cursor {
                    spans.push(Span::styled("▌", Style::default().fg(Color::White)));
                    spans.push(Span::raw(" "));
                } else if entry.is_json {
                    spans.push(Span::styled("▶ ", Style::default().fg(Color::DarkGray)));
                } else {
                    spans.push(Span::raw("  "));
                }

                if show_file_prefix {
                    spans.push(Span::styled("● ", Style::default().fg(file_color)));
                    spans.push(Span::styled(
                        format!("{:<10} ", file_name),
                        Style::default().fg(file_color),
                    ));
                }

                if entry.is_json {
                    let abridged = json_viewer::abridged_json_spans(&entry.line);
                    let abridged = if let Some(re) = &search_re {
                        highlight::apply_search_highlight_spans(abridged, re)
                    } else {
                        abridged
                    };
                    spans.extend(abridged);
                } else {
                    let text_owned;
                    let text: &str = if app.strip_ansi && entry.line.contains('\x1b') {
                        text_owned = highlight::strip_ansi(&entry.line);
                        &text_owned
                    } else {
                        &entry.line
                    };
                    let highlighted = highlight::highlight_line(text, search_re.as_ref());
                    spans.extend(highlighted.spans);
                }

                display_lines.push(pad_line_bg(Line::from(spans), viewport_width, row_bg));
            }
        }

        display_row += h;
    }

    while display_lines.len() < viewport_height {
        display_lines.push(Line::from(""));
    }

    let paragraph = Paragraph::new(display_lines)
        .block(Block::default().borders(Borders::NONE))
        .style(Style::default().bg(Color::Black));
    f.render_widget(paragraph, area);
}

fn render_tab_bar(f: &mut Frame, app: &App, area: Rect) {
    let line = tabs::render_tab_line(app);
    let p = Paragraph::new(line).style(Style::default().bg(Color::Rgb(20, 20, 20)));
    f.render_widget(p, area);
}

fn render_bottom_bar(f: &mut Frame, app: &App, area: Rect) {
    match &app.input_mode {
        InputMode::Search => {
            let spans = vec![
                Span::styled("/", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD)),
                Span::styled(&app.search_query, Style::default().fg(Color::White)),
                Span::styled("█", Style::default().fg(Color::Yellow)),
            ];
            let line = Line::from(spans);
            let p = Paragraph::new(line).style(Style::default().bg(Color::Rgb(30, 30, 30)));
            f.render_widget(p, area);
        }
        InputMode::Normal | InputMode::FilePicker => {
            let help = " ?:help  /:search  f:follow  e:expand-json  Tab:switch  @:files ";
            let p = Paragraph::new(help)
                .style(Style::default().fg(Color::DarkGray).bg(Color::Rgb(20, 20, 20)));
            f.render_widget(p, area);
        }
    }
}

fn render_file_picker(f: &mut Frame, app: &App) {
    let picker = match &app.file_picker {
        Some(p) => p,
        None => return,
    };

    let area = f.area();
    let width = (area.width / 2).max(40).min(area.width.saturating_sub(4));
    let file_count = picker.filtered.len() as u16;
    let height = (file_count + 3).min(area.height.saturating_sub(4)).max(5);
    let x = (area.width.saturating_sub(width)) / 2;
    let y = (area.height.saturating_sub(height)) / 2;

    let popup_bg = Color::Rgb(20, 20, 30);
    let popup_area = Rect::new(x, y, width, height);
    f.render_widget(Clear, popup_area);

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Cyan).bg(popup_bg))
        .style(Style::default().bg(popup_bg))
        .title(" Switch File (@) ")
        .title_style(Style::default().fg(Color::Cyan).bg(popup_bg).add_modifier(Modifier::BOLD));

    let inner = block.inner(popup_area);
    f.render_widget(block, popup_area);

    if inner.height < 2 {
        return;
    }

    let search_line = Line::from(vec![
        Span::styled("> ", Style::default().fg(Color::Cyan).bg(popup_bg)),
        Span::styled(picker.query.clone(), Style::default().fg(Color::White).bg(popup_bg)),
        Span::styled("█", Style::default().fg(Color::Cyan).bg(popup_bg)),
    ]);

    let search_area = Rect::new(inner.x, inner.y, inner.width, 1);
    f.render_widget(
        Paragraph::new(search_line).style(Style::default().bg(popup_bg)),
        search_area,
    );

    let list_area = Rect::new(inner.x, inner.y + 1, inner.width, inner.height.saturating_sub(1));

    let mut lines: Vec<Line> = Vec::new();
    for (i, &file_idx) in picker.filtered.iter().enumerate() {
        if i as u16 >= list_area.height {
            break;
        }
        let file = &app.files[file_idx];
        let color = tabs::file_color(file.color_index);
        let is_selected = i == picker.selected;

        let bg = if is_selected { Color::Rgb(40, 40, 60) } else { popup_bg };
        let prefix = if is_selected { "▸ " } else { "  " };

        let spans = vec![
            Span::styled(prefix, Style::default().fg(Color::White).bg(bg)),
            Span::styled("● ", Style::default().fg(color).bg(bg)),
            Span::styled(
                format!("{} ", file.display_name),
                Style::default().fg(Color::White).bg(bg),
            ),
            Span::styled(
                format!("({})", file.line_count),
                Style::default().fg(Color::DarkGray).bg(bg),
            ),
        ];
        lines.push(pad_line_bg(Line::from(spans), list_area.width as usize, bg));
    }

    if lines.is_empty() {
        lines.push(Line::from(Span::styled(
            "  No matches",
            Style::default().fg(Color::DarkGray).bg(popup_bg),
        )));
    }

    f.render_widget(
        Paragraph::new(lines).style(Style::default().bg(popup_bg)),
        list_area,
    );
}

fn render_help(f: &mut Frame) {
    let area = f.area();
    let width = 52u16.min(area.width.saturating_sub(4));
    let height = 28u16.min(area.height.saturating_sub(4));
    let x = (area.width.saturating_sub(width)) / 2;
    let y = (area.height.saturating_sub(height)) / 2;

    let popup_area = Rect::new(x, y, width, height);
    f.render_widget(Clear, popup_area);

    let block = Block::default()
        .borders(Borders::ALL)
        .border_style(Style::default().fg(Color::Yellow))
        .title(" Keyboard Shortcuts ")
        .title_style(Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD));

    let inner = block.inner(popup_area);
    f.render_widget(block, popup_area);

    let key_style = Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD);
    let desc_style = Style::default().fg(Color::White);
    let header_style = Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD);

    let lines = vec![
        Line::from(Span::styled("  Navigation", header_style)),
        help_line("  j/k, ↑/↓", "Move cursor up/down", key_style, desc_style),
        help_line("  PgUp/PgDn", "Page up/down", key_style, desc_style),
        help_line("  g / Home", "Jump to top", key_style, desc_style),
        help_line("  G / End", "Jump to bottom", key_style, desc_style),
        help_line("  f", "Toggle follow mode", key_style, desc_style),
        Line::from(""),
        Line::from(Span::styled("  Search", header_style)),
        help_line("  /", "Start regex search", key_style, desc_style),
        help_line("  n / p", "Next / previous match", key_style, desc_style),
        help_line("  *", "Search current line", key_style, desc_style),
        help_line("  Esc", "Clear search", key_style, desc_style),
        Line::from(""),
        Line::from(Span::styled("  JSON", header_style)),
        help_line("  Enter", "Toggle JSON expand on cursor", key_style, desc_style),
        help_line("  e", "Expand/collapse all JSON", key_style, desc_style),
        Line::from(""),
        Line::from(Span::styled("  Display", header_style)),
        help_line("  a", "Toggle ANSI-code stripping", key_style, desc_style),
        Line::from(""),
        Line::from(Span::styled("  Files", header_style)),
        help_line("  Tab / S-Tab", "Cycle file tabs", key_style, desc_style),
        help_line("  0 / `", "Combined view (all files)", key_style, desc_style),
        help_line("  1-9", "Jump to file tab", key_style, desc_style),
        help_line("  @ / Ctrl+T", "Fuzzy file picker", key_style, desc_style),
        Line::from(""),
        help_line("  q / Ctrl+C", "Quit", key_style, desc_style),
    ];

    f.render_widget(Paragraph::new(lines), inner);
}

fn help_line<'a>(key: &'a str, desc: &'a str, ks: Style, ds: Style) -> Line<'a> {
    Line::from(vec![
        Span::styled(format!("{:<16}", key), ks),
        Span::styled(desc, ds),
    ])
}

const PALE_BLUE: Color = Color::Rgb(140, 170, 220);
const SOFT_PURPLE: Color = Color::Rgb(180, 140, 210);
const WARM_ORANGE: Color = Color::Rgb(230, 160, 100);

fn animated_logo(tick: usize) -> Vec<Span<'static>> {
    let phase = (tick / 4) % 12;

    let colors: [Color; 3] = match phase {
        0 => [PALE_BLUE, SOFT_PURPLE, WARM_ORANGE],
        1 => [brighten(PALE_BLUE, 30), SOFT_PURPLE, WARM_ORANGE],
        2 => [PALE_BLUE, brighten(SOFT_PURPLE, 30), WARM_ORANGE],
        3 => [PALE_BLUE, SOFT_PURPLE, brighten(WARM_ORANGE, 30)],
        4 => [dim(PALE_BLUE, 40), SOFT_PURPLE, WARM_ORANGE],
        5 => [PALE_BLUE, dim(SOFT_PURPLE, 40), WARM_ORANGE],
        6 => [PALE_BLUE, SOFT_PURPLE, dim(WARM_ORANGE, 40)],
        7 => [WARM_ORANGE, PALE_BLUE, SOFT_PURPLE],
        8 => [SOFT_PURPLE, WARM_ORANGE, PALE_BLUE],
        9 => [PALE_BLUE, SOFT_PURPLE, WARM_ORANGE],
        10 => [brighten(PALE_BLUE, 20), brighten(SOFT_PURPLE, 20), WARM_ORANGE],
        11 => [PALE_BLUE, brighten(SOFT_PURPLE, 20), brighten(WARM_ORANGE, 20)],
        _ => [PALE_BLUE, SOFT_PURPLE, WARM_ORANGE],
    };

    vec![
        Span::styled("⟫", Style::default().fg(colors[0]).add_modifier(Modifier::BOLD)),
        Span::styled("⟫", Style::default().fg(colors[1]).add_modifier(Modifier::BOLD)),
        Span::styled("⟫", Style::default().fg(colors[2]).add_modifier(Modifier::BOLD)),
    ]
}

fn brighten(c: Color, amount: u8) -> Color {
    if let Color::Rgb(r, g, b) = c {
        Color::Rgb(
            r.saturating_add(amount),
            g.saturating_add(amount),
            b.saturating_add(amount),
        )
    } else {
        c
    }
}

fn dim(c: Color, amount: u8) -> Color {
    if let Color::Rgb(r, g, b) = c {
        Color::Rgb(
            r.saturating_sub(amount),
            g.saturating_sub(amount),
            b.saturating_sub(amount),
        )
    } else {
        c
    }
}
