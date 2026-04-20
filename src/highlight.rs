use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use regex::Regex;
use std::sync::LazyLock;

static TIMESTAMP_RE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\b\d{8,20}\b").unwrap());
static LOG_LEVEL_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)\b(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\b").unwrap());
static QUOTED_STRING_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#""(?:[^"\\]|\\.)*""#).unwrap());
static DATE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\d{4}[/-]\d{1,2}[/-]\d{1,2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?").unwrap());

pub fn level_color(level: &str) -> Color {
    match level.to_uppercase().as_str() {
        "TRACE" => Color::DarkGray,
        "DEBUG" => Color::Cyan,
        "INFO" => Color::LightBlue,
        "WARN" => Color::Yellow,
        "ERROR" => Color::Red,
        "FATAL" => Color::Magenta,
        _ => Color::White,
    }
}

pub fn level_style(level: &str) -> Style {
    Style::default()
        .fg(Color::Black)
        .bg(level_color(level))
        .add_modifier(Modifier::BOLD)
}

pub fn highlight_line<'a>(text: &'a str, search_re: Option<&Regex>) -> Line<'a> {
    let mut segments: Vec<(usize, usize, SegmentKind)> = Vec::new();

    for m in LOG_LEVEL_RE.find_iter(text) {
        segments.push((m.start(), m.end(), SegmentKind::LogLevel));
    }

    for m in DATE_RE.find_iter(text) {
        if !overlaps(&segments, m.start(), m.end()) {
            segments.push((m.start(), m.end(), SegmentKind::Date));
        }
    }

    for m in TIMESTAMP_RE.find_iter(text) {
        if !overlaps(&segments, m.start(), m.end()) {
            segments.push((m.start(), m.end(), SegmentKind::Timestamp));
        }
    }

    for m in QUOTED_STRING_RE.find_iter(text) {
        if !overlaps(&segments, m.start(), m.end()) {
            segments.push((m.start(), m.end(), SegmentKind::QuotedString));
        }
    }

    if let Some(re) = search_re {
        for m in re.find_iter(text) {
            segments.push((m.start(), m.end(), SegmentKind::SearchMatch));
        }
    }

    segments.sort_by_key(|s| (s.0, std::cmp::Reverse(s.1)));

    build_spans(text, &segments)
}

#[derive(Clone, Copy, PartialEq)]
enum SegmentKind {
    Timestamp,
    LogLevel,
    QuotedString,
    Date,
    SearchMatch,
}

fn overlaps(segments: &[(usize, usize, SegmentKind)], start: usize, end: usize) -> bool {
    segments
        .iter()
        .any(|&(s, e, _)| start < e && end > s)
}

fn build_spans<'a>(text: &'a str, segments: &[(usize, usize, SegmentKind)]) -> Line<'a> {
    if segments.is_empty() {
        return Line::from(text);
    }

    let mut spans: Vec<Span<'a>> = Vec::new();
    let mut pos = 0;

    let mut sorted: Vec<(usize, usize, SegmentKind)> = Vec::new();
    let mut search_segments: Vec<(usize, usize)> = Vec::new();

    for &(s, e, kind) in segments {
        if kind == SegmentKind::SearchMatch {
            search_segments.push((s, e));
        } else {
            sorted.push((s, e, kind));
        }
    }
    sorted.sort_by_key(|s| s.0);

    for &(start, end, kind) in &sorted {
        if start > pos {
            let plain = &text[pos..start];
            push_with_search_highlights(&mut spans, plain, pos, &search_segments, Style::default());
        }
        if start >= pos {
            let segment_text = &text[start..end];
            let style = match kind {
                SegmentKind::Timestamp => {
                    Style::default().fg(Color::White).add_modifier(Modifier::BOLD)
                }
                SegmentKind::LogLevel => level_style(segment_text),
                SegmentKind::QuotedString => {
                    Style::default().fg(Color::Green).add_modifier(Modifier::BOLD)
                }
                SegmentKind::Date => Style::default().fg(Color::White).add_modifier(Modifier::UNDERLINED),
                SegmentKind::SearchMatch => Style::default().fg(Color::Black).bg(Color::Yellow),
            };
            push_with_search_highlights(&mut spans, segment_text, start, &search_segments, style);
            pos = end;
        }
    }

    if pos < text.len() {
        let remaining = &text[pos..];
        push_with_search_highlights(&mut spans, remaining, pos, &search_segments, Style::default());
    }

    Line::from(spans)
}

fn push_with_search_highlights<'a>(
    spans: &mut Vec<Span<'a>>,
    text: &'a str,
    text_start: usize,
    search_segments: &[(usize, usize)],
    base_style: Style,
) {
    let text_end = text_start + text.len();
    let relevant: Vec<(usize, usize)> = search_segments
        .iter()
        .filter(|&&(s, e)| s < text_end && e > text_start)
        .map(|&(s, e)| (s.max(text_start) - text_start, e.min(text_end) - text_start))
        .collect();

    if relevant.is_empty() {
        spans.push(Span::styled(text, base_style));
        return;
    }

    let search_style = Style::default().fg(Color::Black).bg(Color::Yellow).add_modifier(Modifier::BOLD);
    let mut pos = 0;
    for (s, e) in relevant {
        if s > pos {
            spans.push(Span::styled(&text[pos..s], base_style));
        }
        spans.push(Span::styled(&text[s..e], search_style));
        pos = e;
    }
    if pos < text.len() {
        spans.push(Span::styled(&text[pos..], base_style));
    }
}
