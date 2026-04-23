use ratatui::style::{Color, Style};
use ratatui::text::{Line, Span};

use crate::app::App;

const TAB_COLORS: [Color; 20] = [
    Color::Red,
    Color::Green,
    Color::Yellow,
    Color::Blue,
    Color::Magenta,
    Color::Cyan,
    Color::LightRed,
    Color::LightGreen,
    Color::LightYellow,
    Color::LightBlue,
    Color::LightMagenta,
    Color::LightCyan,
    Color::Rgb(255, 165, 0),
    Color::Rgb(148, 103, 189),
    Color::Rgb(255, 127, 80),
    Color::Rgb(0, 206, 209),
    Color::Rgb(255, 192, 203),
    Color::Rgb(144, 238, 144),
    Color::Rgb(218, 165, 32),
    Color::Rgb(100, 149, 237),
];

pub fn file_color(index: usize) -> Color {
    TAB_COLORS[index % TAB_COLORS.len()]
}

pub fn render_tab_line(app: &App) -> Line<'static> {
    let mut spans = Vec::new();

    if app.trace_filter.is_some() {
        let trace_color = Color::Rgb(197, 134, 192);
        spans.push(Span::styled(
            format!(" Trace matches({}) ", app.trace_indices.len()),
            Style::default().fg(Color::Black).bg(trace_color),
        ));
        return Line::from(spans);
    }

    let combined_style = if app.current_tab == 0 {
        Style::default().fg(Color::Black).bg(Color::White)
    } else {
        Style::default().fg(Color::DarkGray)
    };
    spans.push(Span::styled(
        format!(" Combined({}) ", app.all_lines.len()),
        combined_style,
    ));

    for (i, file) in app.files.iter().enumerate() {
        let tab_idx = i + 1;
        let color = file_color(file.color_index);
        let style = if app.current_tab == tab_idx {
            Style::default().fg(Color::Black).bg(color)
        } else {
            Style::default().fg(color)
        };
        spans.push(Span::raw(" "));
        spans.push(Span::styled(
            format!("{}({})", file.display_name, file.line_count),
            style,
        ));
    }

    Line::from(spans)
}
