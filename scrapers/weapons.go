package scrapers

import (
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type Weapon struct {
	Name       string  `json:"name"`
	DamageType string  `json:"damage_type"`
	Damage     int     `json:"damage"`
	Knockback  float32 `json:"knockback"`
	CritChance float32 `json:"crit_chance"`
	UseTime    int     `json:"use_time"`
	ImageUrl   string  `json:"image_url"`
	FileName   string  `json:"file_name"`
}

func ScrapeWeaponsList() ([]Weapon, error) {
	var weapons []Weapon
	var weapon Weapon
	var err error

	client := &http.Client{}
	var resp *http.Response

	req, err := http.NewRequest("GET", "https://terraria.wiki.gg/wiki/List_of_weapons", nil)
	resp, err = client.Do(req)

	if err != nil {
		return weapons, fmt.Errorf("error during request: %v", err)
	} else if resp.StatusCode != 200 {
		return weapons, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	defer resp.Body.Close()

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return weapons, fmt.Errorf("error collecting weapons data: %v", err)
	}

	doc.Find("table.terraria tbody tr").Each(func(i int, row *goquery.Selection) {
		if i != 0 {
			imgSrc, _ := row.Find("img").Attr("src")
			value := strings.TrimSpace(row.Find("td").Text())
			tds := strings.Split(value, "\n")
			weapon, err = mapWeapon(tds)
			if err != nil {
				log.Fatal("Failed to map weapon: ", err)
			}
			weapon.ImageUrl = "https://terraria.wiki.gg" + imgSrc
			weapons = append(weapons, weapon)
		}
	})

	return weapons, nil
}

func mapWeapon(tds []string) (Weapon, error) {
	var damage int64
	var damageType string
	var knockback float64
	var critChance int64
	var useTime int64
	var err error

	if tds[1] != "" && tds[1] != "-" {
		damage, err = strconv.ParseInt(tds[1], 0, 32)
		if err != nil {
			return Weapon{}, fmt.Errorf("error parsing damage: %v", err)
		}
	} else {
		damage = 0
	}

	if tds[2] == "-" {
		damageType = ""
	} else {
		damageType = tds[2]
	}

	if tds[3] != "" && tds[3] != "-" {
		knockbackRaw := tds[3]
		if len(knockbackRaw) > 10 {
			knockbackRaw = strings.TrimSpace(knockbackRaw[:3])
		}

		knockback, err = strconv.ParseFloat(knockbackRaw, 32)
		if err != nil {
			return Weapon{}, fmt.Errorf("error parsing knockback: %v", err)
		}
	} else {
		knockback = 0
	}

	critChanceRaw := tds[4]
	if critChanceRaw != "" && critChanceRaw != "-" {
		critChance, err = strconv.ParseInt(string(critChanceRaw[0:len(critChanceRaw)-1]), 0, 32)
		if err != nil {
			return Weapon{}, fmt.Errorf("error parsing crit chance: %v", err)
		}
	} else {
		critChance = 0
	}

	if tds[5] != "" && tds[5] != "-" {
		useTimeRaw := tds[5]
		if len(useTimeRaw) > 10 {
			useTimeRaw = strings.TrimSpace(useTimeRaw[:3])
		}

		useTime, err = strconv.ParseInt(useTimeRaw, 0, 32)
		if err != nil {
			return Weapon{}, fmt.Errorf("error parsing use time: %v", err)
		}
	} else {
		useTime = 0
	}

	weapon := Weapon{
		Name:       removeParentheses(tds[0]),
		DamageType: damageType,
		Damage:     int(damage),
		Knockback:  float32(knockback),
		CritChance: float32(critChance) / 100.0,
		UseTime:    int(useTime),
	}

	return weapon, nil
}

func removeParentheses(s string) string {
	re := regexp.MustCompile(`\([^)]*\)`)
	result := re.ReplaceAllString(s, "")
	return strings.TrimSpace(result)
}
