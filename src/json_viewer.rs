use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};

const PRIORITY_FIELDS: &[&str] = &["level", "time", "timestamp", "ts", "msg", "message"];
const LEVEL_FIELDS: &[&str] = &["level", "severity", "lvl"];
const TIME_FIELDS: &[&str] = &["time", "timestamp", "ts", "t", "date", "created_at"];
const MSG_FIELDS: &[&str] = &["msg", "message", "text", "body"];

fn level_color(level: &str) -> Color {
    match level.to_lowercase().as_str() {
        "trace" => Color::DarkGray,
        "debug" => Color::Cyan,
        "info" => Color::LightBlue,
        "warn" | "warning" => Color::Yellow,
        "error" | "err" => Color::Red,
        "fatal" | "panic" => Color::Magenta,
        _ => Color::LightGreen,
    }
}

pub fn abridged_json_spans(raw: &str) -> Vec<Span<'static>> {
    let parsed: serde_json::Value = match serde_json::from_str(raw) {
        Ok(v) => v,
        Err(_) => return vec![
            Span::styled("{", Style::default().fg(Color::Yellow)),
            Span::raw(raw.to_string()),
            Span::styled("}", Style::default().fg(Color::Yellow)),
        ],
    };

    let mut spans = Vec::new();
    let mut extracted_any = false;

    spans.push(Span::styled("{ ", Style::default().fg(Color::Yellow)));

    if let serde_json::Value::Object(ref map) = parsed {
        for &field in LEVEL_FIELDS {
            if let Some(val) = map.get(field) {
                let level_str = match val {
                    serde_json::Value::String(s) => s.clone(),
                    serde_json::Value::Number(n) => numeric_level(n),
                    _ => continue,
                };
                let color = level_color(&level_str);
                spans.push(Span::styled(
                    format!(" {} ", level_str.to_uppercase()),
                    Style::default().fg(Color::Black).bg(color).add_modifier(Modifier::BOLD),
                ));
                spans.push(Span::raw(" "));
                extracted_any = true;
                break;
            }
        }

        for &field in TIME_FIELDS {
            if let Some(val) = map.get(field) {
                let time_str = match val {
                    serde_json::Value::String(s) => format_time_short(&s),
                    serde_json::Value::Number(n) => format_timestamp_short(n),
                    _ => continue,
                };
                spans.push(Span::styled(
                    time_str,
                    Style::default().fg(Color::DarkGray),
                ));
                spans.push(Span::raw(" "));
                extracted_any = true;
                break;
            }
        }

        for &field in MSG_FIELDS {
            if let Some(serde_json::Value::String(s)) = map.get(field) {
                spans.push(Span::styled(
                    s.clone(),
                    Style::default().fg(Color::White),
                ));
                extracted_any = true;
                break;
            }
        }

        if extracted_any {
            let remaining = map.len()
                - LEVEL_FIELDS.iter().filter(|f| map.contains_key(**f)).count()
                - TIME_FIELDS.iter().filter(|f| map.contains_key(**f)).count()
                - MSG_FIELDS.iter().filter(|f| map.contains_key(**f)).count();
            if remaining > 0 {
                spans.push(Span::styled(
                    " …",
                    Style::default().fg(Color::DarkGray),
                ));
            }
        }
    }

    if !extracted_any {
        spans.clear();
        spans.push(Span::styled("{ ", Style::default().fg(Color::Yellow)));
        let truncated = if raw.len() > 120 {
            format!("{}…", &raw[..120])
        } else {
            raw.to_string()
        };
        spans.push(Span::styled(truncated, Style::default().fg(Color::DarkGray)));
    }

    spans.push(Span::styled(" }", Style::default().fg(Color::Yellow)));

    spans
}

fn format_time_short(s: &str) -> String {
    if let Some(t_pos) = s.find('T') {
        let time_part = &s[t_pos + 1..];
        let time_clean = time_part.trim_end_matches('Z');
        if let Some(plus) = time_clean.find('+') {
            return time_clean[..plus].to_string();
        }
        if let Some(minus_pos) = time_clean.rfind('-') {
            if minus_pos > 0 && time_clean[minus_pos..].len() >= 3 {
                return time_clean[..minus_pos].to_string();
            }
        }
        return time_clean.to_string();
    }
    if s.contains(':') && s.len() <= 15 {
        return s.to_string();
    }
    s.to_string()
}

fn format_timestamp_short(n: &serde_json::Number) -> String {
    if let Some(v) = n.as_f64() {
        let v_u64 = v as u64;
        let (secs, millis) = if v_u64 > 1_000_000_000_000_000_000 {
            (v_u64 / 1_000_000_000, (v_u64 / 1_000_000) % 1000)
        } else if v_u64 > 1_000_000_000_000_000 {
            (v_u64 / 1_000_000, (v_u64 / 1_000) % 1000)
        } else if v_u64 > 1_000_000_000_000 {
            (v_u64 / 1_000, v_u64 % 1000)
        } else if v_u64 > 1_000_000_000 {
            let frac = v - (v_u64 as f64);
            (v_u64, (frac * 1000.0) as u64)
        } else {
            return n.to_string();
        };
        let time_of_day = secs % 86400;
        let hours = time_of_day / 3600;
        let minutes = (time_of_day % 3600) / 60;
        let seconds = time_of_day % 60;
        format!("{:02}:{:02}:{:02}.{:03}", hours, minutes, seconds, millis)
    } else {
        n.to_string()
    }
}

fn numeric_level(n: &serde_json::Number) -> String {
    if let Some(v) = n.as_u64() {
        match v {
            10 => "TRACE".to_string(),
            20 => "DEBUG".to_string(),
            30 => "INFO".to_string(),
            40 => "WARN".to_string(),
            50 => "ERROR".to_string(),
            60 => "FATAL".to_string(),
            _ => v.to_string(),
        }
    } else {
        n.to_string()
    }
}

pub fn format_json_lines(raw: &str, indent_prefix: &str, max_width: usize) -> Vec<Line<'static>> {
    let parsed: serde_json::Value = match serde_json::from_str(raw) {
        Ok(v) => v,
        Err(_) => return vec![Line::from(raw.to_string())],
    };

    let mut lines = Vec::new();

    if let serde_json::Value::Object(map) = &parsed {
        append_object_lines(&mut lines, map, indent_prefix, 0, max_width);
    } else {
        render_value_lines(&mut lines, &parsed, 0);
    }

    lines
}

pub fn json_line_count(raw: &str, base_len: usize, max_width: usize) -> usize {
    match serde_json::from_str::<serde_json::Value>(raw) {
        Ok(serde_json::Value::Object(map)) => count_object_lines(&map, base_len, 0, max_width) + 2,
        Ok(_) => 3,
        Err(_) => 1,
    }
}

fn sorted_keys(map: &serde_json::Map<String, serde_json::Value>) -> Vec<String> {
    let mut keys: Vec<String> = map.keys().cloned().collect();
    keys.sort_by_key(|k| {
        let lower = k.to_lowercase();
        let pos = PRIORITY_FIELDS.iter().position(|&f| f == lower);
        (pos.is_none(), pos.unwrap_or(usize::MAX), k.clone())
    });
    keys
}

fn should_expand_value(value: &serde_json::Value) -> bool {
    match value {
        serde_json::Value::Object(m) => !m.is_empty(),
        serde_json::Value::Array(a) => a.iter().any(|v| matches!(
            v,
            serde_json::Value::Object(_) | serde_json::Value::Array(_)
        )),
        _ => false,
    }
}

fn count_object_lines(
    map: &serde_json::Map<String, serde_json::Value>,
    base_len: usize,
    depth: usize,
    max_width: usize,
) -> usize {
    let mut n = 0;
    for (k, value) in map {
        let start_col = base_len + 2 * depth + k.chars().count() + 2;
        n += count_value_lines(value, base_len, depth, start_col, max_width);
    }
    n
}

fn count_value_lines(
    value: &serde_json::Value,
    base_len: usize,
    depth: usize,
    start_col: usize,
    max_width: usize,
) -> usize {
    match value {
        serde_json::Value::Object(m) if !m.is_empty() => {
            1 + count_object_lines(m, base_len, depth + 1, max_width) + 1
        }
        serde_json::Value::Array(arr) if should_expand_array(value, start_col, max_width) => {
            let mut n = 2;
            let child_depth = depth + 1;
            let child_col = base_len + 2 * child_depth;
            for v in arr {
                n += count_value_lines(v, base_len, child_depth, child_col, max_width);
            }
            n
        }
        _ => 1,
    }
}

fn inline_value_width(value: &serde_json::Value) -> usize {
    match value {
        serde_json::Value::String(s) => s.chars().count() + 2,
        serde_json::Value::Number(n) => n.to_string().chars().count(),
        serde_json::Value::Bool(b) => if *b { 4 } else { 5 },
        serde_json::Value::Null => 4,
        serde_json::Value::Array(arr) => inline_array_width(arr),
        serde_json::Value::Object(_) => value.to_string().chars().count(),
    }
}

fn inline_array_width(arr: &[serde_json::Value]) -> usize {
    let mut w = 2;
    for (i, v) in arr.iter().enumerate() {
        if i > 0 {
            w += 2;
        }
        w += inline_value_width(v);
    }
    w
}

fn should_expand_array(value: &serde_json::Value, start_col: usize, max_width: usize) -> bool {
    match value {
        serde_json::Value::Array(arr) if !arr.is_empty() => {
            if should_expand_value(value) {
                return true;
            }
            if max_width == 0 {
                return false;
            }
            start_col.saturating_add(inline_array_width(arr)) > max_width
        }
        _ => false,
    }
}

fn append_object_lines(
    lines: &mut Vec<Line<'static>>,
    map: &serde_json::Map<String, serde_json::Value>,
    base_prefix: &str,
    depth: usize,
    max_width: usize,
) {
    let keys = sorted_keys(map);
    let indent = format!("{}{}", base_prefix, "  ".repeat(depth));
    for (i, key) in keys.iter().enumerate() {
        let value = &map[key];
        let is_last = i == keys.len() - 1;
        append_field_lines(lines, Some(key.as_str()), value, &indent, base_prefix, depth, is_last, max_width);
    }
}

fn append_field_lines(
    lines: &mut Vec<Line<'static>>,
    key: Option<&str>,
    value: &serde_json::Value,
    indent: &str,
    base_prefix: &str,
    depth: usize,
    is_last: bool,
    max_width: usize,
) {
    let key_lower = key.map(|k| k.to_lowercase()).unwrap_or_default();

    match value {
        serde_json::Value::Object(nested) if !nested.is_empty() => {
            let mut spans = vec![Span::raw(indent.to_string())];
            if let Some(k) = key {
                spans.push(Span::styled(k.to_string(), Style::default().fg(Color::Cyan)));
                spans.push(Span::styled(": ", Style::default().fg(Color::DarkGray)));
            }
            spans.push(Span::styled("{", Style::default().fg(Color::Yellow)));
            lines.push(Line::from(spans));

            append_object_lines(lines, nested, base_prefix, depth + 1, max_width);

            let close_indent = format!("{}{}", base_prefix, "  ".repeat(depth));
            let mut close_spans = vec![
                Span::raw(close_indent),
                Span::styled("}", Style::default().fg(Color::Yellow)),
            ];
            if !is_last {
                close_spans.push(Span::styled(",", Style::default().fg(Color::DarkGray)));
            }
            lines.push(Line::from(close_spans));
        }
        serde_json::Value::Array(arr) if {
            let start_col = indent.chars().count() + key.map_or(0, |k| k.chars().count() + 2);
            should_expand_array(value, start_col, max_width)
        } => {
            let mut spans = vec![Span::raw(indent.to_string())];
            if let Some(k) = key {
                spans.push(Span::styled(k.to_string(), Style::default().fg(Color::Cyan)));
                spans.push(Span::styled(": ", Style::default().fg(Color::DarkGray)));
            }
            spans.push(Span::styled("[", Style::default().fg(Color::Yellow)));
            lines.push(Line::from(spans));

            let child_indent = format!("{}{}", base_prefix, "  ".repeat(depth + 1));
            for (i, v) in arr.iter().enumerate() {
                let last = i == arr.len() - 1;
                append_field_lines(lines, None, v, &child_indent, base_prefix, depth + 1, last, max_width);
            }

            let close_indent = format!("{}{}", base_prefix, "  ".repeat(depth));
            let mut close_spans = vec![
                Span::raw(close_indent),
                Span::styled("]", Style::default().fg(Color::Yellow)),
            ];
            if !is_last {
                close_spans.push(Span::styled(",", Style::default().fg(Color::DarkGray)));
            }
            lines.push(Line::from(close_spans));
        }
        _ => {
            let mut spans = vec![Span::raw(indent.to_string())];
            if let Some(k) = key {
                spans.push(Span::styled(k.to_string(), Style::default().fg(Color::Cyan)));
                spans.push(Span::styled(": ", Style::default().fg(Color::DarkGray)));
            }
            append_value_spans(&mut spans, &key_lower, value);
            if !is_last {
                spans.push(Span::styled(",", Style::default().fg(Color::DarkGray)));
            }
            lines.push(Line::from(spans));
        }
    }
}

fn append_value_spans(spans: &mut Vec<Span<'static>>, key: &str, value: &serde_json::Value) {
    let key_lower = key.to_lowercase();
    match value {
        serde_json::Value::String(s) => {
            if LEVEL_FIELDS.contains(&key_lower.as_str()) {
                let color = level_color(s);
                spans.push(Span::styled(
                    format!(" {} ", s),
                    Style::default().fg(Color::Black).bg(color).add_modifier(Modifier::BOLD),
                ));
            } else if MSG_FIELDS.contains(&key_lower.as_str()) {
                spans.push(Span::styled(
                    format!("\"{}\"", s),
                    Style::default()
                        .fg(Color::LightGreen)
                        .add_modifier(Modifier::UNDERLINED),
                ));
            } else {
                spans.push(Span::styled(
                    format!("\"{}\"", s),
                    Style::default().fg(Color::LightGreen),
                ));
            }
        }
        serde_json::Value::Number(n) => {
            if is_timestamp_field(&key_lower) {
                let formatted = format_timestamp_number(n);
                spans.push(Span::styled(formatted, Style::default().fg(Color::White).add_modifier(Modifier::BOLD)));
            } else if LEVEL_FIELDS.contains(&key_lower.as_str()) {
                let level_str = numeric_level(n);
                let color = level_color(&level_str);
                spans.push(Span::styled(
                    format!(" {} ", level_str),
                    Style::default().fg(Color::Black).bg(color).add_modifier(Modifier::BOLD),
                ));
            } else {
                spans.push(Span::styled(
                    n.to_string(),
                    Style::default().fg(Color::Red),
                ));
            }
        }
        serde_json::Value::Bool(b) => {
            spans.push(Span::styled(
                b.to_string(),
                Style::default().fg(Color::Blue).add_modifier(Modifier::BOLD),
            ));
        }
        serde_json::Value::Null => {
            spans.push(Span::styled(
                "null",
                Style::default().fg(Color::LightRed),
            ));
        }
        serde_json::Value::Array(arr) => {
            spans.push(Span::styled("[", Style::default().fg(Color::Yellow)));
            for (i, v) in arr.iter().enumerate() {
                if i > 0 {
                    spans.push(Span::styled(", ", Style::default().fg(Color::DarkGray)));
                }
                append_value_spans(spans, "", v);
            }
            spans.push(Span::styled("]", Style::default().fg(Color::Yellow)));
        }
        serde_json::Value::Object(_) => {
            spans.push(Span::styled(
                value.to_string(),
                Style::default().fg(Color::DarkGray),
            ));
        }
    }
}

fn is_timestamp_field(key: &str) -> bool {
    TIME_FIELDS.contains(&key)
}

fn format_timestamp_number(n: &serde_json::Number) -> String {
    if let Some(v) = n.as_f64() {
        let v_u64 = v as u64;
        if v_u64 > 1_000_000_000_000_000_000 {
            let secs = v_u64 / 1_000_000_000;
            format!("{}", format_epoch(secs))
        } else if v_u64 > 1_000_000_000_000_000 {
            let secs = v_u64 / 1_000_000;
            format!("{}", format_epoch(secs))
        } else if v_u64 > 1_000_000_000_000 {
            let secs = v_u64 / 1_000;
            format!("{}", format_epoch(secs))
        } else if v_u64 > 1_000_000_000 {
            format!("{}", format_epoch(v_u64))
        } else {
            n.to_string()
        }
    } else {
        n.to_string()
    }
}

fn format_epoch(secs: u64) -> String {
    chrono_lite(secs)
}

fn chrono_lite(epoch_secs: u64) -> String {
    let days_since_epoch = epoch_secs / 86400;
    let time_of_day = epoch_secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    let (year, month, day) = days_to_ymd(days_since_epoch);

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, minutes, seconds
    )
}

fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    let mut y = 1970;
    let mut remaining = days;

    loop {
        let days_in_year = if is_leap(y) { 366 } else { 365 };
        if remaining < days_in_year {
            break;
        }
        remaining -= days_in_year;
        y += 1;
    }

    let leap = is_leap(y);
    let month_days = [
        31,
        if leap { 29 } else { 28 },
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];

    let mut m = 0;
    for (i, &d) in month_days.iter().enumerate() {
        if remaining < d {
            m = i;
            break;
        }
        remaining -= d;
    }

    (y, (m + 1) as u64, remaining + 1)
}

fn is_leap(y: u64) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}

fn render_value_lines(lines: &mut Vec<Line<'static>>, value: &serde_json::Value, indent: usize) {
    let prefix = " ".repeat(indent);
    match value {
        serde_json::Value::String(s) => {
            lines.push(Line::from(Span::styled(
                format!("{}\"{}\"", prefix, s),
                Style::default().fg(Color::LightGreen),
            )));
        }
        serde_json::Value::Number(n) => {
            lines.push(Line::from(Span::styled(
                format!("{}{}", prefix, n),
                Style::default().fg(Color::Red),
            )));
        }
        serde_json::Value::Bool(b) => {
            lines.push(Line::from(Span::styled(
                format!("{}{}", prefix, b),
                Style::default().fg(Color::Blue),
            )));
        }
        serde_json::Value::Null => {
            lines.push(Line::from(Span::styled(
                format!("{}null", prefix),
                Style::default().fg(Color::LightRed),
            )));
        }
        _ => {
            lines.push(Line::from(format!("{}{}", prefix, value)));
        }
    }
}
