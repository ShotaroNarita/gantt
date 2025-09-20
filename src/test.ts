import { convert, Gantt } from "./main";

const data: Gantt = {
    "title": "プロジェクト開発スケジュール",
    "slots": [
        {
            "title": "企画・設計",
            "events": [
                {
                    "title": "要件定義",
                    "begin": "2024-01-15",
                    "end": "2024-01-30",
                    "color": "#3498db"
                },
                {
                    "title": "システム設計",
                    "begin": "2024-01-25",
                    "end": "2024-02-15",
                    "color": "#2980b9"
                },
                {
                    "title": "UI/UXデザイン",
                    "begin": "2024-02-01",
                    "end": "2024-02-20",
                    "color": "#9b59b6"
                }
            ]
        },
        {
            "title": "開発",
            "events": [
                {
                    "title": "フロントエンド開発",
                    "begin": "2024-02-15",
                    "end": "2024-04-15",
                    "color": "#e74c3c"
                },
                {
                    "title": "バックエンド開発",
                    "begin": "2024-02-20",
                    "end": "2024-04-10",
                    "color": "#c0392b"
                },
                {
                    "title": "データベース構築",
                    "begin": "2024-02-10",
                    "end": "2024-03-15",
                    "color": "#f39c12"
                }
            ]
        },
        {
            "title": "テスト・検証",
            "events": [
                {
                    "title": "単体テスト",
                    "begin": "2024-03-01",
                    "end": "2024-04-20",
                    "color": "#27ae60"
                },
                {
                    "title": "結合テスト",
                    "begin": "2024-04-10",
                    "end": "2024-05-05",
                    "color": "#2ecc71"
                },
                {
                    "title": "システムテスト",
                    "begin": "2024-04-25",
                    "end": "2024-05-15",
                    "color": "#16a085"
                }
            ]
        },
        {
            "title": "リリース・運用",
            "events": [
                {
                    "title": "本番環境構築",
                    "begin": "2024-05-01",
                    "end": "2024-05-10",
                    "color": "#8e44ad"
                },
                {
                    "title": "リリース準備",
                    "begin": "2024-05-10",
                    "end": "2024-05-20",
                    "color": "#9b59b6"
                },
                {
                    "title": "本番リリース",
                    "begin": "2024-05-20",
                    "end": "2024-05-25",
                    "color": "#e67e22"
                }
            ]
        }
    ]
}



convert(data);