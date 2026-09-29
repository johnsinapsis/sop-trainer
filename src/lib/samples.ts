export interface SampleSop {
  id: string;
  title: string;
  text: string;
}

export const SAMPLE_SOPS: SampleSop[] = [
  {
    id: "mixer-cleaning",
    title: "Mixer cleaning and sanitation",
    text: `SOP-CL-014: Mixer Cleaning and Sanitation
Purpose: Prevent cross-contamination and microbial growth between production batches.

1. Stop the mixer, press E-stop, and apply your personal lock and tag (LOTO) to the main isolator before any cleaning.
2. Remove all product residue from the bowl and paddles using dedicated scrapers. Never use metal tools on the bowl surface.
3. Pre-rinse the bowl and paddles with potable water at 40-45 C until visible residue is gone.
4. Apply the approved alkaline detergent at 2% concentration and scrub all surfaces, including the paddle shafts and the lid gasket, for at least 10 minutes.
5. Rinse thoroughly with potable water until the rinse water pH matches the incoming water (pH 6.5-7.5).
6. Apply the approved sanitizer (200 ppm peracetic acid) and allow a contact time of 2 minutes. Do not rinse sanitizer unless the batch record requires it.
7. Inspect all product-contact surfaces with a flashlight. Any visible residue means repeat from step 4.
8. Take an ATP swab of the bowl base and one paddle. Results must be below 150 RLU. If above, re-clean and re-swab.
9. Remove LOTO, complete the cleaning log with time, chemical lot numbers, and swab results, and sign it. Attach a green "CLEAN" tag to the mixer.

Warnings: Wear chemical-resistant gloves, goggles and apron when handling detergent or sanitizer. Never mix detergent and sanitizer. Ensure ventilation when using peracetic acid. Never reach into the bowl while the mixer is not locked out.`,
  },
  {
    id: "raw-material-weighing",
    title: "Raw material weighing",
    text: `SOP-WH-007: Raw Material Weighing
Purpose: Ensure each batch receives the exact quantity of the correct raw materials, with full traceability.

1. Verify the balance calibration sticker is in date and perform the daily check with the 1 kg and 10 kg certified test weights. Record results in the balance log. Do not use the balance if either reading is out of tolerance (+/- 0.1%).
2. Put on clean gloves, hairnet and lab coat. Wipe the balance pan with 70% isopropyl alcohol and let it dry.
3. Check the batch record and confirm the material code, supplier lot number and expiry date on the container label. Do not use expired or quarantined material.
4. Place a clean, labelled container on the balance and press TARE. Never tare with material already in the container.
5. Add the material slowly until the target weight is reached. The acceptable tolerance is +/- 0.5% of the target weight.
6. Print the weight ticket, attach it to the container, and record the actual weight, lot number and your initials in the batch record.
7. Have a second operator independently verify the material code and weight for all allergen and high-risk ingredients (double check).
8. Reseal the source container, return it to its storage location, and clean any spilled material immediately.
9. Clean the balance and surrounding area before weighing the next material to avoid cross-contact.

Warnings: Use a dust mask when weighing powders. Handle allergens separately and segregate them from other materials. Never weigh two materials at the same time.`,
  },
];
