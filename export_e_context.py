import os
import json

def export_context():
    # Create directory structure
    os.makedirs('docs/legacy', exist_ok=True)
    
    # Define core context
    context = {
        "business_rules": {
            "token_management": "Users earn 100 tokens per correct bracket prediction",
            "leaderboard_rules": "Daily refresh at 00:00 GMT"
        },
        "user_stories": [
            "US1: As a user, I want to view real-time leaderboards",
            "US2: As a GM, I need to manually adjust social points"
        ],
        "architecture_decisions": [
            "AD1: Chose Supabase over Firebase for PostgreSQL compatibility",
            "AD2: Implemented Vercel ISR for leaderboard updates"
        ]
    }

    # Write to JSON file
    with open('docs/legacy/e_essentials.json', 'w') as f:
        json.dump(context, f, indent=2)
        print("Successfully exported context to docs/legacy/e_essentials.json")

if __name__ == "__main__":
    export_context()