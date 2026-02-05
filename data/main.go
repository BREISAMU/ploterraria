package main

import (
	"data/scrapers"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	SUPABASE_SECRET_KEY := os.Getenv("SUPABASE_SECRET_KEY")
	SUPA_BASE_URL := os.Getenv("SUPA_BASE_URL")
	client, err := supabase.NewClient(SUPA_BASE_URL, SUPABASE_SECRET_KEY, &supabase.ClientOptions{})
	if err != nil {
		log.Fatal("Failed to initalize the client: ", err)
	}

	data, err := scrapers.ScrapeWeaponsList()
	if err != nil {
		log.Fatal("Failed to scrape weapons: ", err)
	}

	for i := 0; i < len(data); i++ {
		weapon := data[i]
		_, _, err = client.From("weapons").Upsert(weapon, "", "", "exact").Execute()
		if err != nil {
			log.Fatalf("Error inserting or updating weapon: %v", err)
		}
	}
}
