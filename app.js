/**
 * Pizzaiolo Pro - Pizza Calculator Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  const state = {
    leavening: 'yeast', // 'yeast' or 'sourdough'
    unit: 'g',          // 'g' or 'oz'
    inputs: {
      pizzas: 4,
      ballWeight: 250,
      hydration: 62,
      salt: 2.5,
      oil: 0,
      sugar: 0,
      yeastType: 'instant',
      yeastPct: 0.2,
      starterPct: 15,
      starterHydration: 100,
      sauceLevel: 'standard',
      cheeseLevel: 'standard'
    },
    // Default system presets
    presets: {
      neapolitan: {
        leavening: 'yeast',
        pizzas: 4,
        ballWeight: 250,
        hydration: 62,
        salt: 2.5,
        oil: 0,
        sugar: 0,
        yeastType: 'instant',
        yeastPct: 0.2
      },
      newyork: {
        leavening: 'yeast',
        pizzas: 4,
        ballWeight: 300,
        hydration: 65,
        salt: 2.5,
        oil: 2,
        sugar: 1.5,
        yeastType: 'instant',
        yeastPct: 0.3
      },
      detroit: {
        leavening: 'yeast',
        pizzas: 2,
        ballWeight: 400,
        hydration: 70,
        salt: 2.5,
        oil: 2,
        sugar: 1,
        yeastType: 'instant',
        yeastPct: 0.5
      },
      'sourdough-neo': {
        leavening: 'sourdough',
        pizzas: 4,
        ballWeight: 250,
        hydration: 62,
        salt: 2.8,
        oil: 0,
        sugar: 0,
        starterPct: 15,
        starterHydration: 100
      }
    },
    customRecipes: []
  };

  // --- DOM ELEMENT REFERENCES ---
  const DOM = {
    themeSelector: document.getElementById('theme-selector'),
    leaveningTabs: document.getElementById('leavening-tabs'),
    yeastInputs: document.getElementById('yeast-inputs'),
    sourdoughInputs: document.getElementById('sourdough-inputs'),
    
    // Sliders & Numbers
    numPizzas: document.getElementById('num-pizzas'),
    numPizzasNum: document.getElementById('num-pizzas-num'),
    ballWeight: document.getElementById('ball-weight'),
    ballWeightNum: document.getElementById('ball-weight-num'),
    hydration: document.getElementById('hydration'),
    hydrationNum: document.getElementById('hydration-num'),
    salt: document.getElementById('salt'),
    saltNum: document.getElementById('salt-num'),
    oil: document.getElementById('oil'),
    oilNum: document.getElementById('oil-num'),
    sugar: document.getElementById('sugar'),
    sugarNum: document.getElementById('sugar-num'),
    yeastType: document.getElementById('yeast-type'),
    yeastPct: document.getElementById('yeast-pct'),
    yeastPctNum: document.getElementById('yeast-pct-num'),
    starterPct: document.getElementById('starter-pct'),
    starterPctNum: document.getElementById('starter-pct-num'),
    starterHydration: document.getElementById('starter-hydration'),
    starterHydrationNum: document.getElementById('starter-hydration-num'),
    
    // Toppings
    toppingsTrigger: document.getElementById('toppings-trigger'),
    toppingsContent: document.getElementById('toppings-content'),
    sauceLevel: document.getElementById('sauce-level'),
    cheeseLevel: document.getElementById('cheese-level'),
    
    // Presets & Custom Save
    presetsContainer: document.getElementById('presets-container'),
    customRecipeName: document.getElementById('custom-recipe-name'),
    saveRecipeBtn: document.getElementById('save-recipe-btn'),
    savedRecipesContainer: document.getElementById('saved-recipes-container'),
    
    // Outputs
    resultsSection: document.getElementById('results-section'),
    unitSelector: document.getElementById('unit-selector'),
    totalDoughWeight: document.getElementById('total-dough-weight'),
    individualBallWeight: document.getElementById('individual-ball-weight'),
    ingredientsTableBody: document.getElementById('ingredients-table-body'),
    toppingsTableBody: document.getElementById('toppings-table-body'),
    doughSpecsSummary: document.getElementById('dough-specs-summary'),
    doughRatioDetail: document.getElementById('dough-ratio-detail'),
    
    // Prep Guide
    instructionsContainer: document.getElementById('instructions-container'),
    
    // Mobile sticky summary
    mobileSummaryBar: document.getElementById('mobile-summary-bar'),
    mobileWeightDisplay: document.getElementById('mobile-weight-display'),
    mobileDescDisplay: document.getElementById('mobile-desc-display'),
    scrollToRecipeBtn: document.getElementById('scroll-to-recipe-btn')
  };

  // --- THEME MANAGEMENT ---
  function initTheme() {
    const savedTheme = localStorage.getItem('pizza-calculator-theme') || 'system';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    const htmlEl = document.documentElement;
    
    // Update active class on header buttons
    DOM.themeSelector.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Remove old classes
    htmlEl.classList.remove('theme-light', 'theme-dark');

    if (theme === 'light') {
      htmlEl.classList.add('theme-light');
    } else if (theme === 'dark') {
      htmlEl.classList.add('theme-dark');
    } else {
      // System: follows media query defaults. No explicit class needed
    }

    localStorage.setItem('pizza-calculator-theme', theme);
  }

  // --- CORE CONVERSIONS & MATHS ---
  const CONV = {
    gToOz: (g) => g * 0.035274,
    format: (val, unit) => {
      if (unit === 'oz') {
        return CONV.gToOz(val).toFixed(2) + ' oz';
      }
      // Round yeast to 2 decimal places in grams, others to 1 or whole
      return Math.round(val * 10) / 10 + ' g';
    },
    formatYeast: (val, unit) => {
      if (unit === 'oz') {
        return CONV.gToOz(val).toFixed(3) + ' oz';
      }
      return val.toFixed(2) + ' g';
    }
  };

  // --- RECIPE CALCULATION ENGINE ---
  function calculateRecipe() {
    const input = state.inputs;
    const unit = state.unit;
    const leavening = state.leavening;

    const totalWeight = input.pizzas * input.ballWeight;

    let flour = 0;
    let water = 0;
    let salt = 0;
    let oil = 0;
    let sugar = 0;
    let yeast = 0;
    
    // Sourdough specific
    let starter = 0;
    let starterFlour = 0;
    let starterWater = 0;
    let addedFlour = 0;
    let addedWater = 0;

    if (leavening === 'yeast') {
      // Base multipliers relative to flour (100%)
      const saltFactor = input.salt / 100;
      const hydrationFactor = input.hydration / 100;
      const oilFactor = input.oil / 100;
      const sugarFactor = input.sugar / 100;
      const yeastFactor = input.yeastPct / 100;

      const totalMultiplier = 1 + hydrationFactor + saltFactor + oilFactor + sugarFactor + yeastFactor;

      // Flour is the 100% basis
      flour = totalWeight / totalMultiplier;
      water = flour * hydrationFactor;
      salt = flour * saltFactor;
      oil = flour * oilFactor;
      sugar = flour * sugarFactor;
      yeast = flour * yeastFactor;
    } else {
      // Sourdough mode: Total flour is the 100% basis.
      // Sourdough starter contributes to flour and water.
      const saltFactor = input.salt / 100;
      const hydrationFactor = input.hydration / 100;
      const oilFactor = input.oil / 100;
      const sugarFactor = input.sugar / 100;
      const starterFactor = input.starterPct / 100;
      
      // Multiplier without yeast factor since starter content is split into flour/water
      const totalMultiplier = 1 + hydrationFactor + saltFactor + oilFactor + sugarFactor;

      const totalFlour = totalWeight / totalMultiplier;
      const totalWater = totalFlour * hydrationFactor;
      
      salt = totalFlour * saltFactor;
      oil = totalFlour * oilFactor;
      sugar = totalFlour * sugarFactor;
      starter = totalFlour * starterFactor;

      // Sourdough Starter Flour & Water calculations
      const starterHydrationFactor = input.starterHydration / 100;
      starterFlour = starter / (1 + starterHydrationFactor);
      starterWater = starter - starterFlour;

      // Deduct starter flour and water from dough flour/water
      addedFlour = totalFlour - starterFlour;
      addedWater = totalWater - starterWater;
    }

    // --- RENDER DOUGH RESULTS ---
    DOM.totalDoughWeight.textContent = CONV.format(totalWeight, unit);
    DOM.individualBallWeight.textContent = CONV.format(input.ballWeight, unit);

    DOM.mobileWeightDisplay.textContent = CONV.format(totalWeight, unit);
    DOM.mobileDescDisplay.textContent = `${input.pizzas} Pizzas × ${CONV.format(input.ballWeight, unit)}`;

    // Build Ingredient rows
    let rowsHtml = '';
    
    if (leavening === 'yeast') {
      rowsHtml += `
        <tr>
          <td class="td-name">Flour (Tip: Tipo 00 or Bread Flour)</td>
          <td class="td-val">${CONV.format(flour, unit)}</td>
          <td class="td-pct">100%</td>
        </tr>
        <tr>
          <td class="td-name">Water</td>
          <td class="td-val">${CONV.format(water, unit)}</td>
          <td class="td-pct">${input.hydration}%</td>
        </tr>
      `;

      // Yeast formatting helper
      const yeastNames = {
        'instant': 'Instant Dry Yeast (IDY)',
        'active-dry': 'Active Dry Yeast (ADY)',
        'fresh': 'Fresh Yeast (CY)'
      };
      rowsHtml += `
        <tr>
          <td class="td-name">Yeast (${yeastNames[input.yeastType]})</td>
          <td class="td-val">${CONV.formatYeast(yeast, unit)}</td>
          <td class="td-pct">${input.yeastPct}%</td>
        </tr>
      `;

      rowsHtml += `
        <tr>
          <td class="td-name">Salt</td>
          <td class="td-val">${CONV.format(salt, unit)}</td>
          <td class="td-pct">${input.salt}%</td>
        </tr>
      `;

      if (oil > 0) {
        rowsHtml += `
          <tr>
            <td class="td-name">Olive Oil</td>
            <td class="td-val">${CONV.format(oil, unit)}</td>
            <td class="td-pct">${input.oil}%</td>
          </tr>
        `;
      }

      if (sugar > 0) {
        rowsHtml += `
          <tr>
            <td class="td-name">Sugar</td>
            <td class="td-val">${CONV.format(sugar, unit)}</td>
            <td class="td-pct">${input.sugar}%</td>
          </tr>
        `;
      }
      
      rowsHtml += `
        <tr class="total-row">
          <td>Total Yield</td>
          <td class="td-val">${CONV.format(totalWeight, unit)}</td>
          <td class="td-pct">${Math.round(totalMultiplier * 100)}%</td>
        </tr>
      `;
    } else {
      // Sourdough table
      rowsHtml += `
        <tr class="table-divider"><td colspan="3">Starter Content</td></tr>
        <tr>
          <td class="td-name">Sourdough Starter (Active)</td>
          <td class="td-val">${CONV.format(starter, unit)}</td>
          <td class="td-pct">${input.starterPct}%</td>
        </tr>
        <tr style="font-size: 13px; color: var(--text-secondary);">
          <td class="td-name" style="padding-left: 20px;">↳ Starter Flour (${(starterFlour/totalWeight*100).toFixed(1)}% of dough)</td>
          <td class="td-val">${CONV.format(starterFlour, unit)}</td>
          <td class="td-pct">-</td>
        </tr>
        <tr style="font-size: 13px; color: var(--text-secondary);">
          <td class="td-name" style="padding-left: 20px;">↳ Starter Water (${(starterWater/totalWeight*100).toFixed(1)}% of dough)</td>
          <td class="td-val">${CONV.format(starterWater, unit)}</td>
          <td class="td-pct">-</td>
        </tr>
        
        <tr class="table-divider"><td colspan="3">Added Ingredients (To Mix)</td></tr>
        <tr>
          <td class="td-name">Flour (to add)</td>
          <td class="td-val">${CONV.format(addedFlour, unit)}</td>
          <td class="td-pct">${((addedFlour/(totalFlour))*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td class="td-name">Water (to add)</td>
          <td class="td-val">${CONV.format(addedWater, unit)}</td>
          <td class="td-pct">${((addedWater/(totalFlour))*100).toFixed(1)}%</td>
        </tr>
        <tr>
          <td class="td-name">Salt</td>
          <td class="td-val">${CONV.format(salt, unit)}</td>
          <td class="td-pct">${input.salt}%</td>
        </tr>
      `;

      if (oil > 0) {
        rowsHtml += `
          <tr>
            <td class="td-name">Olive Oil</td>
            <td class="td-val">${CONV.format(oil, unit)}</td>
            <td class="td-pct">${input.oil}%</td>
          </tr>
        `;
      }

      if (sugar > 0) {
        rowsHtml += `
          <tr>
            <td class="td-name">Sugar</td>
            <td class="td-val">${CONV.format(sugar, unit)}</td>
            <td class="td-pct">${input.sugar}%</td>
          </tr>
        `;
      }

      const totalMultiplier = 1 + hydrationFactor + saltFactor + oilFactor + sugarFactor;
      rowsHtml += `
        <tr class="total-row">
          <td>Total Yield</td>
          <td class="td-val">${CONV.format(totalWeight, unit)}</td>
          <td class="td-pct">${Math.round(totalMultiplier * 100)}%</td>
        </tr>
      `;
    }

    DOM.ingredientsTableBody.innerHTML = rowsHtml;

    // --- RENDER TOPPINGS RESULTS ---
    let toppingsHtml = '';
    
    // Sauce calculation
    let saucePerPizza = 0;
    if (input.sauceLevel === 'light') saucePerPizza = 60;
    else if (input.sauceLevel === 'standard') saucePerPizza = 80;
    else if (input.sauceLevel === 'extra') saucePerPizza = 100;
    const totalSauce = input.pizzas * saucePerPizza;

    // Cheese calculation
    let cheesePerPizza = 0;
    if (input.cheeseLevel === 'light') cheesePerPizza = 70;
    else if (input.cheeseLevel === 'standard') cheesePerPizza = 90;
    else if (input.cheeseLevel === 'extra') cheesePerPizza = 120;
    const totalCheese = input.pizzas * cheesePerPizza;

    if (totalSauce > 0) {
      toppingsHtml += `
        <tr>
          <td class="td-name">San Marzano Pizza Sauce</td>
          <td class="td-val">${CONV.format(totalSauce, unit)}</td>
          <td class="td-pct">${CONV.format(saucePerPizza, unit)}</td>
        </tr>
      `;
    }
    
    if (totalCheese > 0) {
      toppingsHtml += `
        <tr>
          <td class="td-name">Low Moisture or Fresh Mozzarella</td>
          <td class="td-val">${CONV.format(totalCheese, unit)}</td>
          <td class="td-pct">${CONV.format(cheesePerPizza, unit)}</td>
        </tr>
      `;
    }

    // Basil and Olive Oil drizzle
    const basilCount = input.pizzas * 3;
    const oilDrizzle = input.pizzas * 5;

    toppingsHtml += `
      <tr>
        <td class="td-name">Fresh Basil Leaves</td>
        <td class="td-val" style="font-family: var(--font-family-sans); font-size: 15px;">~${basilCount} leaves</td>
        <td class="td-pct">3 leaves</td>
      </tr>
      <tr>
        <td class="td-name">Extra Virgin Olive Oil (drizzle)</td>
        <td class="td-val">${CONV.format(oilDrizzle, unit)}</td>
        <td class="td-pct">${CONV.format(5, unit)}</td>
      </tr>
    `;

    DOM.toppingsTableBody.innerHTML = toppingsHtml;

    // --- EXPECTED YIELD TEXT ---
    let summaryText = `${input.pizzas} × ${CONV.format(input.ballWeight, unit)} dough balls. `;
    let detailsText = '';

    if (leavening === 'yeast') {
      detailsText = `
        This yeast recipe uses <strong>${input.hydration}% Hydration</strong>, which is highly responsive and versatile. 
        ${input.oil > 0 ? `Olive oil (${input.oil}%) adds crumb tenderness and color. ` : ''}
        ${input.sugar > 0 ? `Sugar (${input.sugar}%) speeds yeast activity and helps oven browning. ` : ''}
        Suitable for cooking in a conventional oven at 500-550°F (using a pizza stone/steel) or outdoor pizza ovens.
      `;
    } else {
      detailsText = `
        This naturally-leavened sourdough formula utilizes <strong>${input.starterPct}% Starter</strong> at <strong>${input.starterHydration}% Hydration</strong>. 
        Flour and water measurements have been accurately adjusted to subtract the flour (${CONV.format(starterFlour, unit)}) and water (${CONV.format(starterWater, unit)}) already present in the starter.
        This ensures your true dough hydration remains exactly <strong>${input.hydration}%</strong>.
      `;
    }

    DOM.doughSpecsSummary.innerHTML = summaryText;
    DOM.doughRatioDetail.innerHTML = detailsText;

    // --- GENERATE PREPARATION STEPS ---
    generateInstructions(totalSauce, totalCheese, saucePerPizza, cheesePerPizza);
  }

  // --- DYNAMIC STEP-BY-STEP INSTRUCTIONS ---
  function generateInstructions(totalSauce, totalCheese, saucePerPizza, cheesePerPizza) {
    const input = state.inputs;
    const unit = state.unit;
    const leavening = state.leavening;

    let steps = [];

    if (leavening === 'sourdough') {
      steps = [
        {
          title: "Feed Sourdough Starter",
          desc: `Feed your starter 4-8 hours before mixing until it doubles in volume. You will need ${CONV.format(input.pizzas * input.ballWeight * (input.starterPct/100) / (1 + input.starterHydration/100) * (1 + input.starterHydration/100), unit)} of active starter.`
        },
        {
          title: "Autolyse Dough",
          desc: "Combine all of the flour and water specified under 'Added Ingredients'. Mix until no dry flour remains. Cover and let rest for 30 to 45 minutes to build initial gluten structure."
        },
        {
          title: "Add Starter and Knead",
          desc: `Spread the sourdough starter across the dough. Knead for 3-5 minutes, then add the salt (${CONV.format(input.pizzas * input.ballWeight * (input.salt/100) / (1.0 + input.hydration/100 + input.salt/100 + input.oil/100 + input.sugar/100), unit)}) ${input.oil > 0 ? `and olive oil` : ''}. Knead until dough is smooth, elastic, and passes the windowpane test.`
        },
        {
          title: "Bulk Fermentation with Stretch & Folds",
          desc: "Let dough rise at room temperature (70-75°F / 21-24°C) for 4 to 6 hours. Perform 3 sets of stretch-and-folds spaced 30 minutes apart during the first 1.5 hours to strengthen the dough structure."
        },
        {
          title: "Divide and Ball",
          desc: `Divide the bulk dough into ${input.pizzas} equal portions of exactly ${CONV.format(input.ballWeight, unit)}. Shape each piece into a tight, smooth dough ball and place into individual lightly oiled containers.`
        },
        {
          title: "Cold Proof (Fermentation)",
          desc: "Place the containers in the refrigerator (approx. 39°F / 4°C) for 24 to 48 hours. This slow cold fermentation is where the deep complex pizza crust flavor and ease of stretching develops."
        },
        {
          title: "Room Temperature Recovery & Prep",
          desc: `Remove dough balls from the fridge 2.5 to 3 hours before baking. Let them warm up and relax. Meanwhile, preheat your oven to its absolute highest temperature (ideally with a pizza steel or stone inside). Prepare your ${totalSauce > 0 ? `${CONV.format(totalSauce, unit)} of sauce` : 'sauce'} and ${totalCheese > 0 ? `${CONV.format(totalCheese, unit)} of cheese` : 'cheese'}.`
        },
        {
          title: "Stretch, Top and Bake",
          desc: `Press a dough ball into flour, leaving a puffy rim (cornicione). Stretch to size. Top with ~${CONV.format(saucePerPizza, unit)} sauce, ~${CONV.format(cheesePerPizza, unit)} mozzarella, fresh basil, and a drizzle of oil. Bake until crust is charred and crispy!`
        }
      ];
    } else {
      steps = [
        {
          title: "Mix Ingredients (Autolyse)",
          desc: "Combine the flour, water, yeast, and sugar (if any) in a mixing bowl. Stir until a shaggy dough forms, then let rest for 10-15 minutes to allow flour particles to absorb moisture."
        },
        {
          title: "Knead and Add Salt & Oil",
          desc: `Add salt (${CONV.format(input.pizzas * input.ballWeight * (input.salt/100) / (1 + input.hydration/100 + input.salt/100 + input.oil/100 + input.sugar/100 + input.yeastPct/100), unit)}) and oil. Knead by hand or stand mixer for 8-10 minutes until you get a smooth, supple dough ball.`
        },
        {
          title: "Bulk Rise",
          desc: "Place the dough in a lightly greased bowl, cover with a damp cloth, and let rise at room temperature for 1.5 to 2 hours, or until it has doubled in size."
        },
        {
          title: "Divide and Ball",
          desc: `Carefully divide the dough into ${input.pizzas} equal portions of ${CONV.format(input.ballWeight, unit)}. Ball them tightly by folding the edges under. Place on a tray or container, cover, and let proof at room temp for 2 hours (or cold ferment in the fridge for 24 hours for enhanced flavor).`
        },
        {
          title: "Oven Preheating",
          desc: `Preheat your home oven at 500-550°F (260-285°C) for at least 45 minutes with a baking steel or stone on the top rack. Get your toppings ready: portion ${CONV.format(saucePerPizza, unit)} sauce and ${CONV.format(cheesePerPizza, unit)} cheese per pizza.`
        },
        {
          title: "Stretch and Cook",
          desc: "Gently stretch the dough ball using your knuckles, avoiding pressing down the outer edge. Add sauce, cheese, and basil, then slide onto the baking steel. Bake for 5-8 minutes until golden brown and bubbling."
        }
      ];
    }

    // Render Steps
    DOM.instructionsContainer.innerHTML = steps.map((step, idx) => `
      <div class="instruction-step" data-step="${idx}">
        <div class="checkbox-container">
          <div class="custom-checkbox"></div>
        </div>
        <div class="step-details">
          <h4>Step ${idx + 1}: ${step.title}</h4>
          <p class="step-text">${step.desc}</p>
        </div>
      </div>
    `).join('');

    // Rebind check events
    DOM.instructionsContainer.querySelectorAll('.instruction-step').forEach(stepEl => {
      stepEl.addEventListener('click', () => {
        stepEl.classList.toggle('completed');
      });
    });
  }

  // --- PRESETS LOADING ---
  function loadPreset(presetKey) {
    const preset = state.presets[presetKey];
    if (!preset) return;

    state.leavening = preset.leavening;
    
    // Sync state inputs
    Object.keys(preset).forEach(key => {
      if (key !== 'leavening') {
        state.inputs[key] = preset[key];
      }
    });

    // Update yeast/sourdough UI panels and tab buttons
    DOM.leaveningTabs.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.leavening === state.leavening) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (state.leavening === 'yeast') {
      DOM.yeastInputs.style.display = 'block';
      DOM.sourdoughInputs.style.display = 'none';
    } else {
      DOM.yeastInputs.style.display = 'none';
      DOM.sourdoughInputs.style.display = 'block';
    }

    // Update Preset Highlight in UI
    DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => {
      if (card.dataset.preset === presetKey) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Update Slider / Input controls to match loaded preset
    syncControlsToState();
    calculateRecipe();
  }

  function syncControlsToState() {
    const inputs = state.inputs;

    // Num pizzas
    DOM.numPizzas.value = inputs.pizzas;
    DOM.numPizzasNum.value = inputs.pizzas;

    // Ball weight
    DOM.ballWeight.value = inputs.ballWeight;
    DOM.ballWeightNum.value = inputs.ballWeight;

    // Hydration
    DOM.hydration.value = inputs.hydration;
    DOM.hydrationNum.value = inputs.hydration;

    // Salt
    DOM.salt.value = inputs.salt;
    DOM.saltNum.value = inputs.salt;

    // Oil
    DOM.oil.value = inputs.oil;
    DOM.oilNum.value = inputs.oil;

    // Sugar
    DOM.sugar.value = inputs.sugar;
    DOM.sugarNum.value = inputs.sugar;

    // Yeast
    if (inputs.yeastType) DOM.yeastType.value = inputs.yeastType;
    if (inputs.yeastPct) {
      DOM.yeastPct.value = inputs.yeastPct;
      DOM.yeastPctNum.value = inputs.yeastPct;
    }

    // Sourdough
    if (inputs.starterPct) {
      DOM.starterPct.value = inputs.starterPct;
      DOM.starterPctNum.value = inputs.starterPct;
    }
    if (inputs.starterHydration) {
      DOM.starterHydration.value = inputs.starterHydration;
      DOM.starterHydrationNum.value = inputs.starterHydration;
    }
  }

  // --- SAVE & LOAD CUSTOM RECIPES (LOCAL STORAGE) ---
  function initCustomRecipes() {
    const raw = localStorage.getItem('pizza-custom-recipes');
    if (raw) {
      try {
        state.customRecipes = JSON.parse(raw);
      } catch (e) {
        state.customRecipes = [];
      }
    }
    renderSavedRecipes();
  }

  function saveCurrentAsCustom() {
    const nameInput = DOM.customRecipeName.value.trim();
    if (!nameInput) {
      alert('Please enter a recipe name first!');
      return;
    }

    // Capture recipe configuration
    const recipe = {
      id: Date.now(),
      name: nameInput,
      leavening: state.leavening,
      inputs: { ...state.inputs }
    };

    state.customRecipes.push(recipe);
    localStorage.setItem('pizza-custom-recipes', JSON.stringify(state.customRecipes));
    DOM.customRecipeName.value = '';
    renderSavedRecipes();
  }

  function renderSavedRecipes() {
    if (state.customRecipes.length === 0) {
      DOM.savedRecipesContainer.innerHTML = '<span style="font-size: 13px; color: var(--text-secondary);">No custom recipes saved yet.</span>';
      return;
    }

    DOM.savedRecipesContainer.innerHTML = state.customRecipes.map(recipe => `
      <div class="saved-tag" data-recipe-id="${recipe.id}">
        <span class="saved-tag-title">${recipe.name}</span>
        <button class="delete-tag-btn" data-recipe-id="${recipe.id}">&times;</button>
      </div>
    `).join('');

    // Bind event listeners to saved tag buttons
    DOM.savedRecipesContainer.querySelectorAll('.saved-tag').forEach(tagEl => {
      tagEl.addEventListener('click', (e) => {
        // Prevent trigger if clicking delete button
        if (e.target.classList.contains('delete-tag-btn')) return;

        const recipeId = parseInt(tagEl.dataset.recipeId);
        loadCustomRecipe(recipeId);
      });
    });

    // Bind deletes
    DOM.savedRecipesContainer.querySelectorAll('.delete-tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const recipeId = parseInt(btn.dataset.recipeId);
        deleteCustomRecipe(recipeId);
      });
    });
  }

  function loadCustomRecipe(id) {
    const recipe = state.customRecipes.find(r => r.id === id);
    if (!recipe) return;

    state.leavening = recipe.leavening;
    state.inputs = { ...recipe.inputs };

    // Update leavening tabs
    DOM.leaveningTabs.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.leavening === state.leavening) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (state.leavening === 'yeast') {
      DOM.yeastInputs.style.display = 'block';
      DOM.sourdoughInputs.style.display = 'none';
    } else {
      DOM.yeastInputs.style.display = 'none';
      DOM.sourdoughInputs.style.display = 'block';
    }

    // Deselect preset highlights
    DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));

    syncControlsToState();
    calculateRecipe();
  }

  function deleteCustomRecipe(id) {
    state.customRecipes = state.customRecipes.filter(r => r.id !== id);
    localStorage.setItem('pizza-custom-recipes', JSON.stringify(state.customRecipes));
    renderSavedRecipes();
  }

  // --- CONTROLLER BINDINGS & SYNCS ---
  
  // Link Range and Number Input
  function setupDualInput(sliderEl, numberEl, stateKey, parser = parseFloat) {
    sliderEl.addEventListener('input', (e) => {
      const val = parser(e.target.value);
      numberEl.value = val;
      state.inputs[stateKey] = val;
      
      // Deselect preset triggers on manual change
      DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));
      calculateRecipe();
    });

    numberEl.addEventListener('change', (e) => {
      let val = parser(e.target.value);
      const min = parser(e.target.min);
      const max = parser(e.target.max);

      // Clamp value
      if (isNaN(val)) val = parser(sliderEl.value);
      if (val < min) val = min;
      if (val > max) val = max;

      numberEl.value = val;
      sliderEl.value = val;
      state.inputs[stateKey] = val;

      DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));
      calculateRecipe();
    });
  }

  // Setup dual inputs
  setupDualInput(DOM.numPizzas, DOM.numPizzasNum, 'pizzas', parseInt);
  setupDualInput(DOM.ballWeight, DOM.ballWeightNum, 'ballWeight', parseInt);
  setupDualInput(DOM.hydration, DOM.hydrationNum, 'hydration', parseInt);
  setupDualInput(DOM.salt, DOM.saltNum, 'salt', parseFloat);
  setupDualInput(DOM.oil, DOM.oilNum, 'oil', parseFloat);
  setupDualInput(DOM.sugar, DOM.sugarNum, 'sugar', parseFloat);
  setupDualInput(DOM.yeastPct, DOM.yeastPctNum, 'yeastPct', parseFloat);
  setupDualInput(DOM.starterPct, DOM.starterPctNum, 'starterPct', parseInt);
  setupDualInput(DOM.starterHydration, DOM.starterHydrationNum, 'starterHydration', parseInt);

  // Yeast Type Selector
  DOM.yeastType.addEventListener('change', (e) => {
    state.inputs.yeastType = e.target.value;
    calculateRecipe();
  });

  // Toppings Selectors
  DOM.sauceLevel.addEventListener('change', (e) => {
    state.inputs.sauceLevel = e.target.value;
    calculateRecipe();
  });
  DOM.cheeseLevel.addEventListener('change', (e) => {
    state.inputs.cheeseLevel = e.target.value;
    calculateRecipe();
  });

  // Leavening Mode Tabs
  DOM.leaveningTabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.leavening;
      if (mode === state.leavening) return;

      state.leavening = mode;

      DOM.leaveningTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (mode === 'yeast') {
        DOM.yeastInputs.style.display = 'block';
        DOM.sourdoughInputs.style.display = 'none';
      } else {
        DOM.yeastInputs.style.display = 'none';
        DOM.sourdoughInputs.style.display = 'block';
      }

      DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));
      calculateRecipe();
    });
  });

  // Preset Selection Cards
  DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      loadPreset(card.dataset.preset);
    });
  });

  // Unit Toggle Buttons
  DOM.unitSelector.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const unit = btn.dataset.unit;
      if (unit === state.unit) return;

      state.unit = unit;
      DOM.unitSelector.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      calculateRecipe();
    });
  });

  // Theme Toggler Buttons
  DOM.themeSelector.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme);
    });
  });

  // Save Custom Recipe Button
  DOM.saveRecipeBtn.addEventListener('click', saveCurrentAsCustom);

  // Toppings Collapsible Accordion
  DOM.toppingsTrigger.addEventListener('click', () => {
    DOM.toppingsTrigger.classList.toggle('open');
    DOM.toppingsContent.classList.toggle('open');
  });

  // Mobile scroll to recipe helper
  DOM.scrollToRecipeBtn.addEventListener('click', () => {
    DOM.resultsSection.scrollIntoView({ behavior: 'smooth' });
  });

  // --- INITIALIZATION LAUNCH ---
  initTheme();
  initCustomRecipes();
  // Pre-load default Neapolitan preset on launch
  loadPreset('neapolitan');
});
