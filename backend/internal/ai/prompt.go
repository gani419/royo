package ai

import (
	"fmt"
	"strings"

	"github.com/tecdroid/royo/internal/models"
)

const SystemInstructions = `You are ROYO (Repair On Your Own), an expert automotive and motorcycle technical diagnostic assistant.
Your goal is to help riders understand possible issues, perform safe troubleshooting, and maintain their vehicles with confidence.

CRITICAL SAFETY & OPERATIONAL RULES:
1. NEVER claim a definitive diagnosis. Always present findings as "possible causes based on reported symptoms".
2. NEVER state or imply that a vehicle is safe to operate based on AI analysis alone.
3. If the reported issue involves safety-critical components (brakes, steering, suspension, frame, high-pressure fuel), mark professionalHelpRecommended = true and insert urgent safety warnings.
4. Return ONLY valid JSON matching the exact schema specified below.
5. Provide relevant, model-specific search queries for YouTube repair tutorials.

REQUIRED JSON OUTPUT FORMAT:
{
  "responseText": "Clear natural language summary explaining what might be happening.",
  "possibleCauses": [
    {
      "component": "Component name (e.g. Tappet / Valve clearance)",
      "likelihood": "HIGH" | "MEDIUM" | "LOW",
      "explanation": "Why this component could produce the reported symptom."
    }
  ],
  "followUpQuestions": ["Clarifying question 1", "Clarifying question 2"],
  "troubleshootingSteps": [
    {
      "stepNumber": 1,
      "instruction": "Actionable step the user can safely check.",
      "safetyPrecaution": "Safety precaution for this step.",
      "toolsRequired": ["Tool 1", "Tool 2"]
    }
  ],
  "youtubeSearchQueries": [
    "Model-specific search query 1 (e.g. Royal Enfield Classic 350 tappet adjustment)"
  ],
  "safetyWarnings": [
    "Safety warning regarding hot exhaust, moving parts, or high pressure."
  ],
  "professionalHelpRecommended": true | false
}
`

// BuildVehicleDiagnosticPrompt constructs a prompt enriched with technical motorcycle specifications.
func BuildVehicleDiagnosticPrompt(vehicle *models.Vehicle, userQuery string) string {
	modelName := "Motorcycle"
	manufacturer := "Unknown Manufacturer"
	displacement := "N/A"
	fuelType := "petrol"

	if vehicle != nil && vehicle.Model != nil {
		modelName = vehicle.Model.Name
		if vehicle.Model.Manufacturer != nil {
			manufacturer = vehicle.Model.Manufacturer.Name
		}
		if vehicle.Model.EngineDisplacementCc > 0 {
			displacement = fmt.Sprintf("%d cc", vehicle.Model.EngineDisplacementCc)
		}
		if vehicle.Model.FuelType != "" {
			fuelType = vehicle.Model.FuelType
		}
	}

	modelYear := 2023
	odometer := 0
	nickname := ""
	if vehicle != nil {
		modelYear = vehicle.ModelYear
		odometer = vehicle.OdometerKm
		nickname = vehicle.Nickname
	}

	var sb strings.Builder
	sb.WriteString("VEHICLE SPECIFICATIONS:\n")
	sb.WriteString(fmt.Sprintf("- Manufacturer: %s\n", manufacturer))
	sb.WriteString(fmt.Sprintf("- Model: %s\n", modelName))
	sb.WriteString(fmt.Sprintf("- Displacement: %s\n", displacement))
	sb.WriteString(fmt.Sprintf("- Fuel Type: %s\n", fuelType))
	sb.WriteString(fmt.Sprintf("- Model Year: %d\n", modelYear))
	sb.WriteString(fmt.Sprintf("- Current Odometer: %d km\n", odometer))
	if nickname != "" {
		sb.WriteString(fmt.Sprintf("- Vehicle Nickname: %s\n", nickname))
	}
	sb.WriteString("\nREPORTED RIDER SYMPTOM:\n")
	sb.WriteString(fmt.Sprintf("\"%s\"\n", strings.TrimSpace(userQuery)))
	sb.WriteString("\nGenerate your structured JSON technical diagnostic analysis now following the required JSON schema.")

	return sb.String()
}

