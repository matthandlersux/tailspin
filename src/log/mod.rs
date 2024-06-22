use serde::{Deserialize, Serialize};
use serde_json::to_string;
use tokio::fs::File;
use tokio::io::{self, AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;
use tokio::time::{self, Duration};

#[derive(Serialize, Deserialize)]
struct WebsocketPayload<T> {
    data: T,
}

#[derive(Serialize, Deserialize)]
struct FileLine {
    line: String,
    line_number: usize,
    file_path: String,
}

pub async fn tail_log_file(path: String, tx: mpsc::Sender<String>) -> io::Result<()> {
    let file = File::open(path.clone()).await?;
    let reader = BufReader::new(file);
    let mut lines = reader.lines();
    let mut interval = time::interval(Duration::from_millis(300));
    let mut line_number = 0usize;

    loop {
        tokio::select! {
            line = lines.next_line() => {
                match line {
                    Ok(Some(line)) => {
                        line_number += 1;
                        let file_line = FileLine {
                            line: line,
                            line_number,
                            file_path: path.clone(),
                        };
                        let payload = WebsocketPayload {
                            data: file_line,
                        };
                        let json_payload = to_string(&payload).expect("Failed to serialize");
                        if tx.send(json_payload).await.is_err() {
                            eprintln!("Error: Receiver might have dropped");
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
            _ = interval.tick() => {
            },
        }
    }

    Ok(())
}
