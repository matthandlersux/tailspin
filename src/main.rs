use futures::SinkExt;
use tokio::sync::mpsc;
use warp::ws::{Message, WebSocket};
use warp::Filter;

mod log;

#[tokio::main]
async fn main() {
    let static_files = warp::fs::dir("frontend/dist")
        .or(warp::path::end().and(warp::fs::file("frontend/dist/index.html")));
    let websocket = websocket_route().with(warp::cors().allow_any_origin());
    let routes = websocket.or(static_files);

    warp::serve(routes).run(([127, 0, 0, 1], 8088)).await;
}

fn websocket_route() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("ws").and(warp::ws()).map(|ws: warp::ws::Ws| {
        ws.on_upgrade(|socket| async move {
            let (tx, rx) = mpsc::channel(100);

            tokio::spawn(async move {
                for path in std::env::args().skip(1) {
                    let tx_clone = tx.clone();
                    tokio::spawn(async move {
                        println!("path: {}", path);
                        log::tail_log_file(path, tx_clone).await.unwrap();
                    });
                }
            });

            handle_websocket(socket, rx).await;
        })
    })
}

async fn handle_websocket(mut websocket: WebSocket, mut rx: mpsc::Receiver<String>) {
    while let Some(message) = rx.recv().await {
        let ws_message = Message::text(message);
        if let Err(e) = websocket.send(ws_message).await {
            eprintln!("Error sending message: {}", e);
            break;
        }
    }
}
