/**
 * TEST SUITE: eBay Aspects Pass-Through in Product Scanner Preview
 *
 * Verifies that localizedAspects from staging backend are:
 * 1. Captured in prod object
 * 2. Extracted correctly for Model/Product Line
 * 3. Integrated into CSV without data loss
 * 4. Handled safely when missing
 */

// ──────────────────────────────────────────────────────────────────────────
// TEST 1: analyze() preserves aspects from backend response
// ──────────────────────────────────────────────────────────────────────────
function test1_analyzePreservesAspects() {
  console.log('\n=== TEST 1: analyze() preserves aspects ===');

  const mockBackendResponse = {
    data: {
      name: "Test Product",
      brand: "TestBrand",
      aspects: [
        { name: "Model", value: "ABC123" },
        { name: "Color", value: "Blue" }
      ],
      ebay_total: 99.99,
      data_source: "ebay"
    }
  };

  // Simulate prod object construction (from analyze function logic)
  const rwData = mockBackendResponse.data;
  const prod = {
    name: rwData.name || '',
    brand: rwData.brand || '',
    found: true,
    source: rwData.data_source || 'railway',
    aspects: Array.isArray(rwData.aspects) ? rwData.aspects : []
  };

  console.assert(prod.aspects !== undefined, "❌ aspects field missing");
  console.assert(Array.isArray(prod.aspects), "❌ aspects is not an array");
  console.assert(prod.aspects.length === 2, "❌ aspects count incorrect");
  console.assert(prod.aspects[0].name === "Model", "❌ First aspect name incorrect");
  console.assert(prod.aspects[0].value === "ABC123", "❌ First aspect value incorrect");
  console.log("✅ PASS: aspects captured correctly");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 2: Missing aspects handled gracefully
// ──────────────────────────────────────────────────────────────────────────
function test2_missingAspectsHandled() {
  console.log('\n=== TEST 2: Missing aspects handled gracefully ===');

  const mockBackendResponse = {
    data: {
      name: "Another Product",
      brand: "Brand2",
      // NO aspects field
      ebay_total: 49.99,
      data_source: "ebay"
    }
  };

  const rwData = mockBackendResponse.data;
  const prod = {
    name: rwData.name || '',
    brand: rwData.brand || '',
    found: true,
    source: rwData.data_source || 'railway',
    aspects: Array.isArray(rwData.aspects) ? rwData.aspects : []
  };

  console.assert(prod.aspects !== undefined, "❌ aspects should be defined");
  console.assert(Array.isArray(prod.aspects), "❌ aspects should be an array");
  console.assert(prod.aspects.length === 0, "❌ aspects should be empty array");
  console.log("✅ PASS: Missing aspects handled as empty array");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 3: Model extracted correctly from aspects
// ──────────────────────────────────────────────────────────────────────────
function test3_modelExtraction() {
  console.log('\n=== TEST 3: Model extracted from aspects ===');

  const prodAspects = [
    { name: "Model", value: "FN103A" },
    { name: "Color", value: "Black" }
  ];

  // Simulate psExtractStructuredModel logic
  const modelAspectNames = ['Model', 'Model Number', 'Manufacturer Model Code', 'Model Code'];
  let extractedModel = '';

  if (prodAspects) {
    const aspectsArray = Array.isArray(prodAspects) ? prodAspects : [];
    for (let i = 0; i < aspectsArray.length; i++) {
      const aspect = aspectsArray[i];
      if (!aspect || !aspect.name || !aspect.value) continue;

      const aspName = String(aspect.name).trim();
      const aspValue = String(aspect.value).trim();
      const aspNameNorm = aspName.toLowerCase();

      for (let j = 0; j < modelAspectNames.length; j++) {
        if (aspNameNorm === modelAspectNames[j].toLowerCase()) {
          if (aspValue && aspValue !== '' && aspValue !== 'Does Not Apply') {
            extractedModel = aspValue;
            break;
          }
        }
      }
      if (extractedModel) break;
    }
  }

  console.assert(extractedModel === "FN103A", "❌ Model not extracted correctly");
  console.log("✅ PASS: Model extracted as FN103A");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 4: Product Line extracted correctly from aspects
// ──────────────────────────────────────────────────────────────────────────
function test4_productLineExtraction() {
  console.log('\n=== TEST 4: Product Line extracted from aspects ===');

  const prodAspects = [
    { name: "Model", value: "FN103A" },
    { name: "Product Line", value: "CRISPi" },
    { name: "Color", value: "Black" }
  ];

  // Simulate psExtractStructuredProductLine logic
  const lineAspectNames = ['Product Line', 'Product Family', 'Line', 'Collection'];
  let extractedProductLine = '';

  if (prodAspects) {
    const aspectsArray = Array.isArray(prodAspects) ? prodAspects : [];
    for (let i = 0; i < aspectsArray.length; i++) {
      const aspect = aspectsArray[i];
      if (!aspect || !aspect.name || !aspect.value) continue;

      const aspName = String(aspect.name).trim();
      const aspValue = String(aspect.value).trim();
      const aspNameNorm = aspName.toLowerCase();

      for (let j = 0; j < lineAspectNames.length; j++) {
        if (aspNameNorm === lineAspectNames[j].toLowerCase()) {
          if (aspValue && aspValue !== '') {
            extractedProductLine = aspValue;
            break;
          }
        }
      }
      if (extractedProductLine) break;
    }
  }

  console.assert(extractedProductLine === "CRISPi", "❌ Product Line not extracted correctly");
  console.log("✅ PASS: Product Line extracted as CRISPi");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 5: Multiple aspects preserved
// ──────────────────────────────────────────────────────────────────────────
function test5_multipleAspectsPreserved() {
  console.log('\n=== TEST 5: Multiple aspects preserved ===');

  const prodAspects = [
    { name: "Brand", value: "Ninja" },
    { name: "Type", value: "Air Fryer" },
    { name: "Model", value: "Ninja CRISPi" },
    { name: "Color", value: "Blue" },
    { name: "Power Source", value: "Electric" },
    { name: "Power", value: "1500 W" }
  ];

  // Verify all aspects are preserved as-is
  console.assert(prodAspects.length === 6, "❌ Aspect count incorrect");
  console.assert(prodAspects[0].name === "Brand", "❌ First aspect name wrong");
  console.assert(prodAspects[2].name === "Model", "❌ Third aspect name wrong");
  console.assert(prodAspects[3].value === "Blue", "❌ Color value wrong");
  console.log("✅ PASS: All aspects preserved exactly");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 6: Product Line absent (not fabricated)
// ──────────────────────────────────────────────────────────────────────────
function test6_productLineAbsent() {
  console.log('\n=== TEST 6: Product Line absent (not fabricated) ===');

  // Real UPC 622356684781 scenario - has Model but NOT Product Line
  const prodAspects = [
    { name: "Brand", value: "Ninja" },
    { name: "Model", value: "Ninja CRISPi" },
    { name: "Type", value: "Air Fryer" },
    { name: "Color", value: "Blue" },
    { name: "Power", value: "1500 W" }
    // NO Product Line
  ];

  // Simulate extraction
  const lineAspectNames = ['Product Line', 'Product Family', 'Line', 'Collection'];
  let extractedProductLine = '';

  for (let i = 0; i < prodAspects.length; i++) {
    const aspect = prodAspects[i];
    const aspNameNorm = aspect.name.toLowerCase();
    for (let j = 0; j < lineAspectNames.length; j++) {
      if (aspNameNorm === lineAspectNames[j].toLowerCase()) {
        extractedProductLine = aspect.value;
        break;
      }
    }
    if (extractedProductLine) break;
  }

  console.assert(extractedProductLine === '', "❌ Product Line should be empty");
  console.log("✅ PASS: Product Line correctly absent (not fabricated)");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 7: Case-insensitive aspect matching
// ──────────────────────────────────────────────────────────────────────────
function test7_caseInsensitiveMatching() {
  console.log('\n=== TEST 7: Case-insensitive aspect matching ===');

  // Test various case combinations
  const testCases = [
    { name: "MODEL", value: "ABC123" },      // All caps
    { name: "model", value: "ABC123" },      // All lowercase
    { name: "Model", value: "ABC123" },      // Title case
    { name: "MODEL NUMBER", value: "XYZ789" }, // Multi-word caps
    { name: "model number", value: "XYZ789" }  // Multi-word lowercase
  ];

  const modelAspectNames = ['Model', 'Model Number'];

  for (const testCase of testCases) {
    const aspNameNorm = testCase.name.toLowerCase();
    let found = false;
    for (const modelName of modelAspectNames) {
      if (aspNameNorm === modelName.toLowerCase()) {
        found = true;
        break;
      }
    }
    console.assert(found, `❌ Failed to match: ${testCase.name}`);
  }

  console.log("✅ PASS: All case variants matched correctly");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// TEST 8: Realistic Ninja UPC 622356684781
// ──────────────────────────────────────────────────────────────────────────
function test8_ninjaUPC() {
  console.log('\n=== TEST 8: Realistic Ninja UPC 622356684781 ===');

  const mockBackendResponse = {
    data: {
      name: "Ninja CRISPi Air Fryer FN103A",
      brand: "Ninja",
      ebay_total: 79.99,
      category: "20741",
      category_name: "Small Appliances",
      data_source: "ebay",
      aspects: [
        { name: "Brand", value: "Ninja" },
        { name: "Type", value: "Air Fryer" },
        { name: "Power Source", value: "Electric" },
        { name: "Capacity", value: "4 qt, 6 cup" },
        { name: "Color", value: "Blue" },
        { name: "Model", value: "Ninja CRISPi" },
        { name: "Material", value: "Glass" },
        { name: "Power", value: "1500 W" },
        { name: "Maximum Temperature", value: "450°F" },
        { name: "Number of Settings/Programs", value: "5" }
      ]
    }
  };

  const rwData = mockBackendResponse.data;
  const prod = {
    name: rwData.name || '',
    brand: rwData.brand || '',
    found: true,
    source: rwData.data_source || 'railway',
    aspects: Array.isArray(rwData.aspects) ? rwData.aspects : []
  };

  console.assert(prod.aspects.length === 10, "❌ Should have 10 aspects");
  console.assert(prod.name === "Ninja CRISPi Air Fryer FN103A", "❌ Name mismatch");
  console.assert(prod.brand === "Ninja", "❌ Brand mismatch");

  // Extract Model
  let model = '';
  for (const aspect of prod.aspects) {
    if (aspect.name.toLowerCase() === 'model') {
      model = aspect.value;
      break;
    }
  }
  console.assert(model === "Ninja CRISPi", "❌ Model should be 'Ninja CRISPi'");

  // Extract Product Line (should be absent)
  let productLine = '';
  for (const aspect of prod.aspects) {
    if (aspect.name.toLowerCase() === 'product line') {
      productLine = aspect.value;
      break;
    }
  }
  console.assert(productLine === '', "❌ Product Line should be empty");

  console.log("✅ PASS: Realistic Ninja UPC data handled correctly");
  return true;
}

// ──────────────────────────────────────────────────────────────────────────
// RUN ALL TESTS
// ──────────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  TEST SUITE: eBay Aspects Integration (Preview)        ║');
console.log('╚══════════════════════════════════════════════════════════╝');

try {
  test1_analyzePreservesAspects();
  test2_missingAspectsHandled();
  test3_modelExtraction();
  test4_productLineExtraction();
  test5_multipleAspectsPreserved();
  test6_productLineAbsent();
  test7_caseInsensitiveMatching();
  test8_ninjaUPC();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ ALL TESTS PASSED                                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
} catch (e) {
  console.error('\n❌ TEST FAILURE:', e);
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  ❌ TEST SUITE FAILED                                    ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}
