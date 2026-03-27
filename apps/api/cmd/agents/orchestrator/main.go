// OrchestratorAgent runs all pipeline agents in sequence:
// SetWatcher → Quality → Pricing.
// No API key required.
//
// Usage:
//
//	cd apps/api && go run ./cmd/agents/orchestrator
//	cd apps/api && go run ./cmd/agents/orchestrator --skip-pricing
package main

import (
	"flag"
	"fmt"
	"log"
	"os/exec"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	skipPricing := flag.Bool("skip-pricing", false, "Skip the pricing step")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("No .env, using system env")
	}

	fmt.Println("╔══════════════════════════════════╗")
	fmt.Println("║     OrchestratorAgent starting   ║")
	fmt.Println("╚══════════════════════════════════╝")
	fmt.Println()

	type step struct {
		name string
		args []string
		skip bool
	}

	steps := []step{
		{"SetWatcher", []string{"run", "./cmd/agents/set-watcher"}, false},
		{"Quality",    []string{"run", "./cmd/agents/quality"}, false},
		{"Pricing",    []string{"run", "./cmd/agents/pricing"}, *skipPricing},
	}

	results := map[string]string{}

	for _, s := range steps {
		if s.skip {
			fmt.Printf("── %s — SKIPPED ──────────────────────\n\n", s.name)
			results[s.name] = "skipped"
			continue
		}

		fmt.Printf("── %s ────────────────────────────────\n", s.name)
		start := time.Now()

		cmd := exec.Command("go", s.args...)
		cmd.Stdout = log.Writer()
		cmd.Stderr = log.Writer()

		if err := cmd.Run(); err != nil {
			fmt.Printf("✗ %s failed: %v\n\n", s.name, err)
			results[s.name] = "error"
		} else {
			elapsed := time.Since(start).Round(time.Second)
			fmt.Printf("✓ %s done in %s\n\n", s.name, elapsed)
			results[s.name] = "ok"
		}
	}

	fmt.Println("╔══════════════════════════════════╗")
	fmt.Println("║      OrchestratorAgent done      ║")
	fmt.Println("╚══════════════════════════════════╝")
	for name, status := range results {
		icon := "✓"
		if status == "error" {
			icon = "✗"
		} else if status == "skipped" {
			icon = "–"
		}
		fmt.Printf("  %s %s: %s\n", icon, name, status)
	}
}
