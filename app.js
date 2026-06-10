/**
 * Pizzaiolo Pro - Pizza Calculator Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- SAFE LOCAL STORAGE WRAPPER (Prevents crashes in file:// URIs or private browsing) ---
  const SafeStorage = {
    fallback: {},
    getItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn(`localStorage.getItem failed for key "${key}":`, e);
        return this.fallback[key] || null;
      }
    },
    setItem(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn(`localStorage.setItem failed for key "${key}":`, e);
        this.fallback[key] = String(value);
      }
    }
  };

  // --- DEFAULT INPUT VALUES ---
  const DEFAULT_INPUTS = {
    pizzas: 4,
    ballWeight: 250,
    hydration: 62,
    salt: 2.5,
    oil: 0,
    sugar: 0,
    yeastType: 'instant',
    yeastPct: 0.2,
    sauceLevel: 'standard',
    cheeseLevel: 'standard'
  };

  // --- APPLICATION STATE ---
  const state = {
    unit: 'g',          // 'g' or 'oz'
    inputs: { ...DEFAULT_INPUTS },
    // Default system presets
    presets: {
      neapolitan: {
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
        pizzas: 2,
        ballWeight: 400,
        hydration: 70,
        salt: 2.5,
        oil: 2,
        sugar: 1,
        yeastType: 'instant',
        yeastPct: 0.5
      }
    },
    customRecipes: []
  };

  // --- DOM ELEMENT REFERENCES ---
  const DOM = {
    themeSelector: document.getElementById('theme-selector'),
    themeSelect: document.getElementById('theme-select'),
    themeActiveIcon: document.getElementById('theme-active-icon'),
    yeastInputs: document.getElementById('yeast-inputs'),
    
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
    const savedTheme = SafeStorage.getItem('pizza-calculator-theme') || 'system';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    const htmlEl = document.documentElement;
    
    // Update select element value
    if (DOM.themeSelect) DOM.themeSelect.value = theme;

    // Update dynamic theme SVG icon
    const iconPaths = {
      light: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-12.37a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zm-12.37 12.37a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z',
      dark: 'M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8.2-9.8.6-.1 1.2.3 1.3.9.1.6-.2 1.2-.8 1.4-3.4 1-5.7 4.1-5.7 7.6 0 4.4 3.6 8 8 8 3.5 0 6.6-2.3 7.6-5.7.2-.6.8-.9 1.4-.8.6.1 1 .7.9 1.3-.9 4.7-5 8.2-9.8 8.2z',
      system: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2V4a8 8 0 1 1 0 16z'
    };
    if (DOM.themeActiveIcon && iconPaths[theme]) {
      DOM.themeActiveIcon.innerHTML = `<path d="${iconPaths[theme]}"/>`;
    }

    // Remove old classes
    htmlEl.classList.remove('theme-light', 'theme-dark');

    if (theme === 'light') {
      htmlEl.classList.add('theme-light');
    } else if (theme === 'dark') {
      htmlEl.classList.add('theme-dark');
    } else {
      // System: follows media query defaults. No explicit class needed
    }

    SafeStorage.setItem('pizza-calculator-theme', theme);
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

    const totalWeight = input.pizzas * input.ballWeight;

    // Base multipliers relative to flour (100%)
    const saltFactor = input.salt / 100;
    const hydrationFactor = input.hydration / 100;
    const oilFactor = input.oil / 100;
    const sugarFactor = input.sugar / 100;
    const yeastFactor = input.yeastPct / 100;

    const totalMultiplier = 1 + hydrationFactor + saltFactor + oilFactor + sugarFactor + yeastFactor;

    // Flour is the 100% basis
    const flour = totalWeight / totalMultiplier;
    const water = flour * hydrationFactor;
    const salt = flour * saltFactor;
    const oil = flour * oilFactor;
    const sugar = flour * sugarFactor;
    const yeast = flour * yeastFactor;

    // --- RENDER DOUGH RESULTS ---
    DOM.totalDoughWeight.textContent = CONV.format(totalWeight, unit);
    DOM.individualBallWeight.textContent = CONV.format(input.ballWeight, unit);

    DOM.mobileWeightDisplay.textContent = CONV.format(totalWeight, unit);
    DOM.mobileDescDisplay.textContent = `${input.pizzas} Pizzas × ${CONV.format(input.ballWeight, unit)}`;

    // Build Ingredient rows
    let rowsHtml = '';
    
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

    // --- GENERATE PREPARATION STEPS ---
    generateInstructions(totalSauce, totalCheese, saucePerPizza, cheesePerPizza);
  }

  // --- DYNAMIC STEP-BY-STEP INSTRUCTIONS ---
  function generateInstructions(totalSauce, totalCheese, saucePerPizza, cheesePerPizza) {
    const input = state.inputs;
    const unit = state.unit;

    const steps = [
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

    const currentPizzas = state.inputs.pizzas;
    
    // Reset inputs to default and sync preset values
    state.inputs = { ...DEFAULT_INPUTS };
    Object.keys(preset).forEach(key => {
      state.inputs[key] = preset[key];
    });

    state.inputs.pizzas = currentPizzas;

    // Update Preset Highlight in UI
    DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => {
      if (card.dataset.preset === presetKey) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Deselect saved tag highlights
    DOM.savedRecipesContainer.querySelectorAll('.saved-tag').forEach(tag => tag.classList.remove('active'));

    // Save last used recipe
    SafeStorage.setItem('pizza-last-recipe', JSON.stringify({ type: 'preset', key: presetKey }));

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
  }

  // --- SAVE & LOAD CUSTOM RECIPES (LOCAL STORAGE) ---
  function initCustomRecipes() {
    const raw = SafeStorage.getItem('pizza-custom-recipes');
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
      inputs: { ...state.inputs }
    };

    state.customRecipes.push(recipe);
    SafeStorage.setItem('pizza-custom-recipes', JSON.stringify(state.customRecipes));
    DOM.customRecipeName.value = '';
    renderSavedRecipes();
    loadCustomRecipe(recipe.id);
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

    const currentPizzas = state.inputs.pizzas;

    state.inputs = { ...DEFAULT_INPUTS, ...recipe.inputs };

    state.inputs.pizzas = currentPizzas;

    // Deselect preset highlights
    DOM.presetsContainer.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));

    // Update active tag highlight
    DOM.savedRecipesContainer.querySelectorAll('.saved-tag').forEach(tag => {
      if (parseInt(tag.dataset.recipeId) === id) {
        tag.classList.add('active');
      } else {
        tag.classList.remove('active');
      }
    });

    // Save last used recipe
    SafeStorage.setItem('pizza-last-recipe', JSON.stringify({ type: 'custom', id: id }));

    syncControlsToState();
    calculateRecipe();
  }

  function deleteCustomRecipe(id) {
    state.customRecipes = state.customRecipes.filter(r => r.id !== id);
    SafeStorage.setItem('pizza-custom-recipes', JSON.stringify(state.customRecipes));
    renderSavedRecipes();

    // Check if the deleted one was the last used
    const raw = SafeStorage.getItem('pizza-last-recipe');
    if (raw) {
      try {
        const last = JSON.parse(raw);
        if (last.type === 'custom' && last.id === id) {
          SafeStorage.setItem('pizza-last-recipe', JSON.stringify({ type: 'preset', key: 'neapolitan' }));
          loadPreset('neapolitan');
        }
      } catch (e) {}
    }
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

  // Yeast Type Selector with automatic conversion
  DOM.yeastType.addEventListener('change', (e) => {
    const oldType = state.inputs.yeastType;
    const newType = e.target.value;
    if (oldType === newType) return;

    const conversionRatios = {
      'instant': 1.0,
      'active-dry': 1.25,
      'fresh': 3.0
    };

    // Calculate converted percentage
    const currentPct = state.inputs.yeastPct;
    let newPct = currentPct * (conversionRatios[newType] / conversionRatios[oldType]);
    
    // Clamp between 0.01% and 5.0% and round to 2 decimal places
    newPct = Math.max(0.01, Math.min(5.0, Math.round(newPct * 100) / 100));

    state.inputs.yeastType = newType;
    state.inputs.yeastPct = newPct;

    console.log("Yeast type changed:", oldType, "->", newType, "New Pct:", newPct);

    // Sync input controls
    DOM.yeastPct.value = newPct;
    DOM.yeastPctNum.value = newPct;

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

  // Theme Dropdown Change Event
  if (DOM.themeSelect) {
    DOM.themeSelect.addEventListener('change', (e) => {
      setTheme(e.target.value);
    });
  }

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

  function loadLastUsedRecipe() {
    const raw = SafeStorage.getItem('pizza-last-recipe');
    if (raw) {
      try {
        const last = JSON.parse(raw);
        if (last.type === 'preset') {
          loadPreset(last.key);
          return;
        } else if (last.type === 'custom') {
          // Find if custom recipe still exists
          const exists = state.customRecipes.some(r => r.id === last.id);
          if (exists) {
            loadCustomRecipe(last.id);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to load last used recipe:", e);
      }
    }
    // Fallback to neapolitan if none found or custom recipe deleted
    loadPreset('neapolitan');
  }

  function initVersion() {
    fetch('version.json')
      .then(response => {
        if (!response.ok) throw new Error('Not found');
        return response.json();
      })
      .then(data => {
        if (data && data.commit) {
          const footer = document.querySelector('.app-footer');
          if (footer) {
            const separator = document.createElement('span');
            separator.className = 'footer-separator';
            separator.textContent = '•';
            
            const commitLink = document.createElement('a');
            commitLink.className = 'commit-badge';
            commitLink.href = `https://github.com/hypnoticnautilus/pizzaiolo/commit/${data.commit}`;
            commitLink.target = '_blank';
            commitLink.rel = 'noopener noreferrer';
            commitLink.innerHTML = `
              <svg class="git-branch-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                <line x1="6" y1="3" x2="6" y2="15"></line>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <path d="M18 9a9 9 0 0 1-9 9"></path>
              </svg>
              <span>${data.commit}</span>
            `;
            
            footer.appendChild(separator);
            footer.appendChild(commitLink);
          }
        }
      })
      .catch(() => {
        // Silently ignore if version.json is not present (e.g. in local dev before deployment)
      });
  }

  // --- INITIALIZATION LAUNCH ---
  initTheme();
  initCustomRecipes();
  // Load last used recipe or default to neapolitan
  loadLastUsedRecipe();
  initVersion();
});
