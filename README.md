# Pizzaiolo Pro 🍕

A simple single-page Pizza Dough & Toppings Calculator designed for home cooks to scale recipes, calculate toppings, save custom formulas, and follow a step-by-step dough preparation checklist.

---

## Key Features

- **Baker's Percentage Engine**: Calculates ingredient weights based on flour weight as the 100% baseline.
- **Built-in Presets**:
  - **Neapolitan**: Classic 62% hydration wood-fired style.
  - **New York**: 65% hydration, crispy home-oven bake with sugar and oil.
  - **Detroit Style**: 70% hydration, thick pan pizza.
- **Yeast Type Conversions**: Automatically scales yeast percentages when switching yeast types based on [King Arthur Baking's yeast conversion ratios](https://www.kingarthurbaking.com/pro/reference/yeast):
  - **Instant Dry Yeast (IDY)**: Baseline (1.0x)
  - **Active Dry Yeast (ADY)**: 1.25x scaling
  - **Fresh Yeast (CY)**: 3.0x scaling
- **Collapsible Toppings Panel**: Automatically calculates required sauce, cheese, basil, and olive oil drizzle based on the number of pizzas and desired topping levels.
- **Recipe Manager**: Save your customized dough formulas to local storage and load them with a single click.
- **Dual-Unit Support**: Toggle dynamically between Grams (g) and Ounces (oz).
- **Interactive Preparation Guide**: Generates a dynamic checklist that tracks your progress through mixing, bulk fermentation, balling, cold proofing, and baking.

---

## The Math Behind Pizzaiolo Pro

### Baker's Percentages
All ingredients are scaled relative to the total flour weight (always 100%):
- $\text{Total Multiplier} = 1 + \frac{\text{Hydration}\%}{100} + \frac{\text{Salt}\%}{100} + \frac{\text{Oil}\%}{100} + \frac{\text{Sugar}\%}{100} + \frac{\text{Yeast}\%}{100}$
- $\text{Flour Weight} = \frac{\text{Total Target Weight}}{\text{Total Multiplier}}$
- $\text{Water Weight} = \text{Flour Weight} \times \frac{\text{Hydration}\%}{100}$
- $\text{Other Ingredients} = \text{Flour Weight} \times \frac{\text{Ingredient}\%}{100}$

---

## Local Setup

Since Pizzaiolo Pro is a single-page application built using vanilla HTML, CSS, and JavaScript, it does not require any build tools or dependencies:

1. Clone this repository:
   ```bash
   git clone https://github.com/hypnoticnautilus/pizzaiolo.git
   ```
2. Open `index.html` directly in your browser or run a simple local web server:
   ```bash
   # Python 3
   python3 -m http.server 8000
   ```

---

## Server Deployment

To deploy this project to your production server, run the following combined command (replace placeholders with your actual server configuration):

```bash
ssh user@your-server.com "mkdir -p /var/www/pizzaiolo" && \
rsync -avz --exclude '.git' --exclude 'README.md' --exclude 'LICENSE' ./ user@your-server.com:/var/www/pizzaiolo/ && \
ssh user@your-server.com "chown -R www-data:www-data /var/www/pizzaiolo"
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
