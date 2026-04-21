use std::io;
use std::time::Duration;

use crossterm::event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyModifiers};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::prelude::*;
use tokio::sync::mpsc;

mod app;
mod highlight;
mod input;
mod json_viewer;
mod tabs;
mod ui;

use app::{App, LogEntry};

#[tokio::main]
async fn main() -> io::Result<()> {
    let files: Vec<String> = std::env::args().skip(1).collect();
    if files.is_empty() {
        eprintln!("Usage: tailspin-tui <file1> [file2] ...");
        std::process::exit(1);
    }

    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let (tx, mut rx) = mpsc::channel::<LogEntry>(1000);

    for (i, path) in files.iter().enumerate() {
        let tx_clone = tx.clone();
        let path_clone = path.clone();
        tokio::spawn(async move {
            if let Err(e) = crate::app::tail_file(path_clone, i, tx_clone).await {
                eprintln!("Error tailing file: {}", e);
            }
        });
    }
    drop(tx);

    let mut app = App::new(files);

    loop {
        while let Ok(entry) = rx.try_recv() {
            app.add_entry(entry);
        }

        terminal.draw(|f| ui::render(f, &mut app))?;

        if event::poll(Duration::from_millis(50))? {
            match event::read()? {
                Event::Key(key) => {
                    if key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL) {
                        break;
                    }
                    if input::handle_key(&mut app, key) {
                        break;
                    }
                }
                Event::Mouse(mouse) => {
                    input::handle_mouse(&mut app, mouse);
                }
                _ => {}
            }
        }
    }

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen, DisableMouseCapture)?;
    terminal.show_cursor()?;

    Ok(())
}
