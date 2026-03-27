package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"ploterraria/scrapers"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

func downloadImage(imageURL string) (string, error) {
	resp, err := http.Get(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %w", err)
	} else if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status code: %d", resp.StatusCode)
	}
	defer resp.Body.Close()

	spliturl := strings.Split(imageURL, "/")
	fileName := strings.Split(spliturl[len(spliturl)-1], "?")[0]
	outputPath := "frontend/public/weapons/" + fileName

	outFile, err := os.Create(outputPath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to save image: %w", err)
	}

	fmt.Printf("Image saved: %s\n", fileName)
	return fileName, nil
}

func main() {
	download := flag.Bool("download", false, "Download weapon images")
	flag.Parse()

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
		if *download {
			fileName, err := downloadImage(weapon.ImageUrl)
			weapon.FileName = fileName
			if err != nil {
				log.Fatalf("Error downloading image: %v", err)
			}
			time.Sleep(5 * time.Second)
		}
		_, _, err = client.From("weapons").Upsert(weapon, "", "", "exact").Execute()
		if err != nil {
			log.Fatalf("Error inserting or updating weapon: %v", err)
		}
	}
}
