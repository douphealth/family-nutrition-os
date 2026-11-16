import * as React from "react";
import { useSyncExternalStore } from "react";
import { jsx } from "react/jsx-runtime";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Dexie from "dexie";
import { z } from "zod";
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/ui/button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
//#endregion
//#region src/engine/foods.js
/**
* ZENITH PRO · food composition table
* ---------------------------------------------------------------------------
* The single source of truth for what is IN the food. Every recipe ingredient
* points at one entry here, which is what lets the app
*
*   • derive a recipe's macros and micronutrients from grams × composition
*     instead of trusting numbers somebody typed next to the recipe;
*   • merge "Αυγά" and "Αυγό" (same food, different recipes) into one shopping
*     line instead of two;
*   • say exactly where every number came from.
*
* Composition is per 100 g (or 100 ml for liquids — see `density`) of the RAW,
* EDIBLE food, because recipes list raw weights and shopping is done raw. Cooking
* changes water content, not the macros of what went into the pot.
*
* Provenance
*   fdc     USDA FoodData Central "SR Legacy" id, and `usda` the description that id
*           must have. Every value on an entry with an `fdc` is asserted equal to the
*           committed snapshot (data/usda-fdc.json) by tests/food-provenance.test.mjs,
*           and the snapshot's description must match `usda` — so neither a number nor
*           a mistyped id can drift from the source unnoticed. Refresh the snapshot
*           with `npm run data:usda`.
*   proxy   The USDA entry stands in for a broader or regional food (e.g. one
*           species of white fish for "fish fillet"). Said out loud in `note`.
*   approx  No suitable USDA entry exists (regional products). Values are typical
*           retail-label figures and are flagged as approximate in the UI.
*
* Nutrient keys (per 100 g): p protein g · c carbohydrate g · f fat g ·
*   fib fibre g · na sodium mg · fe iron mg · ca calcium mg.
* Energy is deliberately NOT stored: it is always derived from the macros with the
* EU conversion factors 4/4/9 and 2 for fibre (see nutrition-engine.js), so it cannot
* disagree with them.
*
* role — which household portion group scales the ingredient for each member
*   ('protein' | 'carbs' | 'fats' | 'vegetables'), or a weighted mix such as
*   { protein: .5, carbs: .5 } for legumes, which are both.
* pieceG — grams in one piece, for recipe units of «τεμ».
* density — g per ml, for recipe units of «ml».
* shop — how the household buys it: the unit to show, and the step to round UP to.
*/
var NUTRIENTS = [
	"p",
	"c",
	"f",
	"fib",
	"na",
	"fe",
	"ca"
];
var F = (name, plural, aisle, role, per100, extra = {}) => ({
	name,
	plural,
	aisle,
	role,
	per100,
	...extra
});
var FOODS = {
	yogurt: F("Γιαούρτι στραγγιστό 2%", "Γιαούρτι στραγγιστό 2%", "dairy", "protein", {
		p: 9.95,
		c: 3.94,
		f: 1.92,
		fib: 0,
		na: 34,
		fe: .04,
		ca: 115
	}, {
		fdc: 170903,
		usda: "Yogurt, Greek, plain, lowfat",
		note: "Greek yogurt, plain, lowfat",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	feta: F("Φέτα", "Φέτα", "dairy", "fats", {
		p: 14.2,
		c: 3.88,
		f: 21.5,
		fib: 0,
		na: 1140,
		fe: .65,
		ca: 493
	}, {
		fdc: 173420,
		usda: "Cheese, feta",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	hardcheese: F("Τυρί τριμμένο (κεφαλοτύρι)", "Τυρί τριμμένο (κεφαλοτύρι)", "dairy", "fats", {
		p: 31.8,
		c: 3.63,
		f: 26.9,
		fib: 0,
		na: 1430,
		fe: .77,
		ca: 1060
	}, {
		fdc: 171249,
		usda: "Cheese, romano",
		proxy: true,
		note: "Romano, a hard sheep-milk cheese, stands in for kefalotyri",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	milk: F("Γάλα ημιαποβουτυρωμένο", "Γάλα ημιαποβουτυρωμένο", "dairy", "protein", {
		p: 3.3,
		c: 4.8,
		f: 1.98,
		fib: 0,
		na: 47,
		fe: .02,
		ca: 120
	}, {
		fdc: 171267,
		usda: "Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D",
		density: 1.03,
		note: "Milk, reduced fat, 2%",
		shop: {
			unit: "ml",
			step: 500
		}
	}),
	egg: F("Αυγό", "Αυγά", "dairy", "protein", {
		p: 12.6,
		c: .72,
		f: 9.51,
		fib: 0,
		na: 142,
		fe: 1.75,
		ca: 56
	}, {
		fdc: 171287,
		usda: "Egg, whole, raw, fresh",
		pieceG: 50,
		note: "One egg = 50 g edible",
		shop: {
			unit: "τεμ",
			step: 6
		}
	}),
	chicken: F("Στήθος κοτόπουλου", "Στήθος κοτόπουλου", "protein", "protein", {
		p: 22.5,
		c: 0,
		f: 2.62,
		fib: 0,
		na: 45,
		fe: .37,
		ca: 5
	}, {
		fdc: 171077,
		usda: "Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw",
		note: "Skinless, boneless breast, raw",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	beef: F("Κιμάς μοσχαρίσιος", "Κιμάς μοσχαρίσιος", "protein", "protein", {
		p: 20,
		c: 0,
		f: 10,
		fib: 0,
		na: 66,
		fe: 2.24,
		ca: 12
	}, {
		fdc: 174030,
		usda: "Beef, ground, 90% lean meat / 10% fat, raw",
		note: "Ground beef, 90% lean, raw",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	fish: F("Φιλέτο ψαριού (τσιπούρα/λαβράκι)", "Φιλέτο ψαριού (τσιπούρα/λαβράκι)", "protein", "protein", {
		p: 18.4,
		c: 0,
		f: 2,
		fib: 0,
		na: 68,
		fe: .29,
		ca: 10
	}, {
		fdc: 175142,
		usda: "Fish, sea bass, mixed species, raw",
		proxy: true,
		note: "Sea bass stands in for lean white fish (sea bream, sea bass, hake)",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	lentils: F("Φακές ξηρές", "Φακές ξηρές", "pantry", {
		protein: .5,
		carbs: .5
	}, {
		p: 24.6,
		c: 63.4,
		f: 1.06,
		fib: 10.7,
		na: 6,
		fe: 6.51,
		ca: 35
	}, {
		fdc: 172420,
		usda: "Lentils, raw",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	giantBeans: F("Γίγαντες ξηροί", "Γίγαντες ξηροί", "pantry", {
		protein: .5,
		carbs: .5
	}, {
		p: 21.5,
		c: 63.4,
		f: .69,
		fib: 19,
		na: 18,
		fe: 7.51,
		ca: 81
	}, {
		fdc: 174252,
		usda: "Lima beans, large, mature seeds, raw",
		note: "Large lima beans",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	whiteBeans: F("Φασόλια ξηρά", "Φασόλια ξηρά", "pantry", {
		protein: .5,
		carbs: .5
	}, {
		p: 22.3,
		c: 60.8,
		f: 1.5,
		fib: 15.3,
		na: 5,
		fe: 5.49,
		ca: 147
	}, {
		fdc: 173745,
		usda: "Beans, navy, mature seeds, raw",
		note: "Navy (haricot) beans",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	chickpeas: F("Ρεβίθια ξηρά", "Ρεβίθια ξηρά", "pantry", {
		protein: .5,
		carbs: .5
	}, {
		p: 20.5,
		c: 63,
		f: 6.04,
		fib: 12.2,
		na: 24,
		fe: 4.31,
		ca: 57
	}, {
		fdc: 173756,
		usda: "Chickpeas (garbanzo beans, bengal gram), mature seeds, raw",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	oats: F("Βρώμη", "Βρώμη", "pantry", "carbs", {
		p: 13.2,
		c: 67.7,
		f: 6.52,
		fib: 10.1,
		na: 6,
		fe: 4.25,
		ca: 52
	}, {
		fdc: 173904,
		usda: "Cereals, oats, regular and quick, not fortified, dry",
		note: "Rolled oats, dry",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	rice: F("Ρύζι", "Ρύζι", "pantry", "carbs", {
		p: 7.13,
		c: 80,
		f: .66,
		fib: 1.3,
		na: 5,
		fe: .8,
		ca: 28
	}, {
		fdc: 169756,
		usda: "Rice, white, long-grain, regular, raw, unenriched",
		note: "White long-grain, raw, unenriched",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	pasta: F("Ζυμαρικά ολικής", "Ζυμαρικά ολικής", "pantry", "carbs", {
		p: 13.9,
		c: 73.4,
		f: 2.93,
		fib: 9.2,
		na: 6,
		fe: 3.62,
		ca: 29
	}, {
		fdc: 169738,
		usda: "Pasta, whole-wheat, dry",
		note: "Whole-wheat pasta, dry",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	trahana: F("Τραχανάς", "Τραχανάς", "pantry", "carbs", {
		p: 12,
		c: 68,
		f: 3,
		fib: 4,
		na: 600,
		fe: 3,
		ca: 90
	}, {
		approx: true,
		note: "Typical retail-label figures for dry trahana (no USDA equivalent)",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	paximadi: F("Παξιμάδι κριθαρένιο", "Παξιμάδια κριθαρένια", "bakery", "carbs", {
		p: 10.5,
		c: 68,
		f: 2.5,
		fib: 9,
		na: 520,
		fe: 3,
		ca: 40
	}, {
		approx: true,
		pieceG: 60,
		note: "Typical retail-label figures for barley rusk (no USDA equivalent)",
		shop: {
			unit: "τεμ",
			step: 1
		}
	}),
	bread: F("Ψωμί ολικής", "Ψωμί ολικής", "bakery", "carbs", {
		p: 12.4,
		c: 42.7,
		f: 3.5,
		fib: 6,
		na: 455,
		fe: 2.47,
		ca: 161
	}, {
		fdc: 172688,
		usda: "Bread, whole-wheat, commercially prepared",
		note: "Whole-wheat bread, commercial",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	pita: F("Πίτα ολικής", "Πίτες ολικής", "bakery", "carbs", {
		p: 9.8,
		c: 55.9,
		f: 1.71,
		fib: 6.1,
		na: 421,
		fe: 3.06,
		ca: 15
	}, {
		fdc: 174916,
		usda: "Bread, pita, whole-wheat",
		pieceG: 80,
		note: "Whole-wheat pita",
		shop: {
			unit: "τεμ",
			step: 1
		}
	}),
	oliveOil: F("Ελαιόλαδο", "Ελαιόλαδο", "pantry", "fats", {
		p: 0,
		c: 0,
		f: 100,
		fib: 0,
		na: 2,
		fe: .56,
		ca: 1
	}, {
		fdc: 171413,
		usda: "Oil, olive, salad or cooking",
		density: .91,
		shop: {
			unit: "ml",
			step: 50
		}
	}),
	walnuts: F("Καρύδια", "Καρύδια", "pantry", "fats", {
		p: 15.2,
		c: 13.7,
		f: 65.2,
		fib: 6.7,
		na: 2,
		fe: 2.91,
		ca: 98
	}, {
		fdc: 170187,
		usda: "Nuts, walnuts, english",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	tahini: F("Ταχίνι", "Ταχίνι", "pantry", "fats", {
		p: 17,
		c: 21.2,
		f: 53.8,
		fib: 9.3,
		na: 115,
		fe: 8.95,
		ca: 426
	}, {
		fdc: 170189,
		usda: "Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type)",
		note: "Sesame butter, from roasted and toasted kernels",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	olives: F("Ελιές", "Ελιές", "pantry", "fats", {
		p: 1.03,
		c: 3.84,
		f: 15.3,
		fib: 3.3,
		na: 1560,
		fe: .49,
		ca: 52
	}, {
		fdc: 169096,
		usda: "Olives, pickled, canned or bottled, green",
		proxy: true,
		note: "Brined olives; brine makes them a major source of salt",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	honey: F("Μέλι", "Μέλι", "pantry", "carbs", {
		p: .3,
		c: 82.4,
		f: 0,
		fib: .2,
		na: 4,
		fe: .42,
		ca: 6
	}, {
		fdc: 169640,
		usda: "Honey",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	tomatoCanned: F("Ντομάτα κονκασέ (κονσέρβα)", "Ντομάτα κονκασέ (κονσέρβα)", "pantry", "vegetables", {
		p: 1.64,
		c: 7.29,
		f: .28,
		fib: 1.9,
		na: 186,
		fe: 1.3,
		ca: 34
	}, {
		fdc: 170501,
		usda: "Tomatoes, crushed, canned",
		note: "Crushed tomatoes, canned",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	banana: F("Μπανάνα", "Μπανάνες", "produce", "carbs", {
		p: 1.09,
		c: 22.8,
		f: .33,
		fib: 2.6,
		na: 1,
		fe: .26,
		ca: 5
	}, {
		fdc: 173944,
		usda: "Bananas, raw",
		pieceG: 118,
		note: "One medium banana = 118 g peeled",
		shop: {
			unit: "τεμ",
			step: 1
		}
	}),
	fruit: F("Φρούτα εποχής", "Φρούτα εποχής", "produce", "vegetables", {
		p: .26,
		c: 13.8,
		f: .17,
		fib: 2.4,
		na: 1,
		fe: .12,
		ca: 6
	}, {
		fdc: 171688,
		usda: "Apples, raw, with skin",
		proxy: true,
		note: "Apple stands in for typical seasonal fruit",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	tomato: F("Ντομάτα", "Ντομάτες", "produce", "vegetables", {
		p: .88,
		c: 3.89,
		f: .2,
		fib: 1.2,
		na: 5,
		fe: .27,
		ca: 10
	}, {
		fdc: 170457,
		usda: "Tomatoes, red, ripe, raw, year round average",
		pieceG: 123,
		shop: {
			unit: "g",
			step: 250
		}
	}),
	cucumber: F("Αγγούρι", "Αγγούρια", "produce", "vegetables", {
		p: .65,
		c: 3.63,
		f: .11,
		fib: .5,
		na: 2,
		fe: .28,
		ca: 16
	}, {
		fdc: 168409,
		usda: "Cucumber, with peel, raw",
		pieceG: 200,
		shop: {
			unit: "g",
			step: 250
		}
	}),
	pepper: F("Πιπεριά", "Πιπεριές", "produce", "vegetables", {
		p: .86,
		c: 4.64,
		f: .17,
		fib: 1.7,
		na: 3,
		fe: .34,
		ca: 10
	}, {
		fdc: 170427,
		usda: "Peppers, sweet, green, raw",
		pieceG: 150,
		note: "Green sweet pepper",
		shop: {
			unit: "g",
			step: 250
		}
	}),
	zucchini: F("Κολοκύθι", "Κολοκυθάκια", "produce", "vegetables", {
		p: 1.21,
		c: 3.11,
		f: .32,
		fib: 1,
		na: 8,
		fe: .37,
		ca: 16
	}, {
		fdc: 169291,
		usda: "Squash, summer, zucchini, includes skin, raw",
		shop: {
			unit: "g",
			step: 250
		}
	}),
	onion: F("Κρεμμύδι", "Κρεμμύδια", "produce", "vegetables", {
		p: 1.1,
		c: 9.34,
		f: .1,
		fib: 1.7,
		na: 4,
		fe: .21,
		ca: 23
	}, {
		fdc: 17e4,
		usda: "Onions, raw",
		pieceG: 110,
		shop: {
			unit: "g",
			step: 250
		}
	}),
	carrot: F("Καρότο", "Καρότα", "produce", "vegetables", {
		p: .93,
		c: 9.58,
		f: .24,
		fib: 2.8,
		na: 69,
		fe: .3,
		ca: 33
	}, {
		fdc: 170393,
		usda: "Carrots, raw",
		pieceG: 61,
		shop: {
			unit: "g",
			step: 250
		}
	}),
	celery: F("Σέλινο", "Σέλινο", "produce", "vegetables", {
		p: .69,
		c: 2.97,
		f: .17,
		fib: 1.6,
		na: 80,
		fe: .2,
		ca: 40
	}, {
		fdc: 169988,
		usda: "Celery, raw",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	potato: F("Πατάτες", "Πατάτες", "produce", "carbs", {
		p: 2.05,
		c: 17.5,
		f: .09,
		fib: 2.1,
		na: 6,
		fe: .81,
		ca: 12
	}, {
		fdc: 170026,
		usda: "Potatoes, flesh and skin, raw",
		shop: {
			unit: "g",
			step: 250
		}
	}),
	spinach: F("Σπανάκι", "Σπανάκι", "produce", "vegetables", {
		p: 2.86,
		c: 3.63,
		f: .39,
		fib: 2.2,
		na: 79,
		fe: 2.71,
		ca: 99
	}, {
		fdc: 168462,
		usda: "Spinach, raw",
		shop: {
			unit: "g",
			step: 250
		}
	}),
	mushroom: F("Μανιτάρια", "Μανιτάρια", "produce", "vegetables", {
		p: 3.09,
		c: 3.26,
		f: .34,
		fib: 1,
		na: 5,
		fe: .5,
		ca: 3
	}, {
		fdc: 169251,
		usda: "Mushrooms, white, raw",
		shop: {
			unit: "g",
			step: 100
		}
	}),
	lettuce: F("Μαρούλι", "Μαρούλι", "produce", "vegetables", {
		p: 1.23,
		c: 3.29,
		f: .3,
		fib: 2.1,
		na: 8,
		fe: .97,
		ca: 33
	}, {
		fdc: 169247,
		usda: "Lettuce, cos or romaine, raw",
		note: "Romaine",
		shop: {
			unit: "g",
			step: 250
		}
	}),
	greens: F("Χόρτα εποχής", "Χόρτα εποχής", "produce", "vegetables", {
		p: 1.7,
		c: 4.7,
		f: .3,
		fib: 4,
		na: 45,
		fe: .9,
		ca: 100
	}, {
		fdc: 169992,
		usda: "Chicory greens, raw",
		proxy: true,
		note: "Chicory greens stand in for wild/seasonal greens (horta)",
		shop: {
			unit: "g",
			step: 250
		}
	}),
	herbs: F("Μαϊντανός & δυόσμος", "Μαϊντανός & δυόσμος", "produce", "vegetables", {
		p: 2.97,
		c: 6.33,
		f: .79,
		fib: 3.3,
		na: 56,
		fe: 6.2,
		ca: 138
	}, {
		fdc: 170416,
		usda: "Parsley, fresh",
		note: "Parsley",
		shop: {
			unit: "g",
			step: 50
		}
	}),
	lemon: F("Λεμόνι", "Λεμόνια", "produce", "vegetables", {
		p: 1.1,
		c: 9.32,
		f: .3,
		fib: 2.8,
		na: 2,
		fe: .6,
		ca: 26
	}, {
		fdc: 167746,
		usda: "Lemons, raw, without peel",
		pieceG: 58,
		shop: {
			unit: "τεμ",
			step: 1
		}
	})
};
/** Grams represented by a recipe line: `q` × unit. Throws on an impossible unit. */
function gramsOf(ing) {
	const food = FOODS[ing.f];
	if (!food) throw new Error(`Unknown food "${ing.f}"`);
	if (ing.u === "g") return ing.q;
	if (ing.u === "ml") return ing.q * (food.density ?? 1);
	if (ing.u === "τεμ") {
		if (!food.pieceG) throw new Error(`"${ing.f}" has no piece weight but is used in τεμ`);
		return ing.q * food.pieceG;
	}
	throw new Error(`Unknown unit "${ing.u}" for "${ing.f}"`);
}
/** The inverse of `gramsOf`: `grams` expressed in a recipe line's own unit. */
function qtyOf(ing, grams) {
	const food = FOODS[ing.f];
	if (ing.u === "ml") return grams / (food.density ?? 1);
	if (ing.u === "τεμ") return grams / food.pieceG;
	return grams;
}
/** Portion-group weights for a food, normalised to { protein, carbs, fats, vegetables }. */
function roleWeights(food) {
	const r = food.role;
	if (typeof r === "string") return { [r]: 1 };
	const sum = Object.values(r).reduce((a, b) => a + b, 0) || 1;
	return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v / sum]));
}
/**
* Nutrients contained in `grams` of a food. Unrounded.
*
* `c` is AVAILABLE carbohydrate — sugars and starch, without fibre — because that
* is what EU food labels list and what carries 4 kcal/g; fibre is reported on its
* own and carries 2 kcal/g (Regulation (EU) 1169/2011, Annex XIV). USDA publishes
* carbohydrate "by difference", which includes fibre, so per100 keeps the USDA
* figure (and stays equal to its source) and the subtraction happens here.
*/
function nutrientsIn(foodId, grams) {
	const food = FOODS[foodId];
	const k = grams / 100;
	const out = Object.fromEntries(NUTRIENTS.map((n) => [n, food.per100[n] * k]));
	out.c = Math.max(0, out.c - out.fib);
	return out;
}
var r1 = (n) => Math.round(n * 10) / 10;
/**
* Turns an authored recipe ({ ingredients: [{ f, q, u }] }) into the shape the
* rest of the app reads: each line gains its display name, aisle and grams, and
* the recipe gains `base` (macros of ONE reference adult serving) and `micro`
* (fibre, sodium, iron, calcium) — all computed from the food table. Carbohydrate is
* AVAILABLE carbohydrate (see nutrientsIn).
*/
function deriveRecipe(raw) {
	const total = Object.fromEntries(NUTRIENTS.map((n) => [n, 0]));
	const ingredients = raw.ingredients.map((ing) => {
		const food = FOODS[ing.f];
		const g = gramsOf(ing);
		const n = nutrientsIn(ing.f, g);
		for (const k of NUTRIENTS) total[k] += n[k];
		return {
			...ing,
			n: ing.n ?? (ing.u === "τεμ" && ing.q > 1 ? food.plural : food.name),
			a: food.aisle,
			g
		};
	});
	return {
		...raw,
		ingredients,
		base: {
			p: r1(total.p),
			c: r1(total.c),
			f: r1(total.f),
			fib: r1(total.fib)
		},
		micro: {
			fib: r1(total.fib),
			na: Math.round(total.na),
			fe: r1(total.fe),
			ca: Math.round(total.ca)
		}
	};
}
var RECIPES = [
	{
		id: "oats",
		name: "Γιαούρτι, βρώμη & φρούτο",
		slot: "breakfast",
		time: 5,
		tags: ["fast", "highprotein"],
		ingredients: [
			{
				f: "yogurt",
				q: 200,
				u: "g"
			},
			{
				f: "oats",
				q: 55,
				u: "g"
			},
			{
				f: "banana",
				q: 1,
				u: "τεμ"
			},
			{
				f: "walnuts",
				q: 15,
				u: "g"
			}
		],
		steps: [
			"Βάλε τη βρώμη στο γιαούρτι και άστην 5′ να μαλακώσει.",
			"Κόψε το φρούτο από πάνω.",
			"Πρόσθεσε τους ξηρούς καρπούς τελευταία για να μείνουν τραγανιστοί."
		],
		tip: "Ιδανικό πρωινό πριν από πρωινή προπόνηση: υδατάνθρακες + πρωτεΐνη σε ένα μπολ."
	},
	{
		id: "eggs",
		name: "Αυγά, ψωμί ολικής & ντομάτα",
		slot: "breakfast",
		time: 10,
		tags: ["highprotein"],
		ingredients: [
			{
				f: "egg",
				q: 2,
				u: "τεμ"
			},
			{
				f: "bread",
				q: 70,
				u: "g"
			},
			{
				f: "tomato",
				q: 100,
				u: "g"
			},
			{
				f: "olives",
				q: 15,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 5,
				u: "ml"
			},
			{
				f: "fruit",
				q: 150,
				u: "g"
			}
		],
		steps: [
			"Ψήσε τα αυγά στο ελαιόλαδο σε μέτρια φωτιά.",
			"Σέρβιρε με ψωμί ολικής και φρέσκια ντομάτα.",
			"Οι ελιές μπαίνουν στο τέλος, χωρίς επιπλέον αλάτι.",
			"Πρόσθεσε ένα φρούτο εποχής στο πλάι."
		],
		tip: "Το αλάτι στις ελιές αρκεί — μη προσθέτεις επιπλέον στο πιάτο."
	},
	{
		id: "porridge",
		name: "Χυλός βρώμης με μήλο & καρύδια",
		slot: "breakfast",
		time: 10,
		tags: ["fast", "veg"],
		ingredients: [
			{
				f: "oats",
				q: 60,
				u: "g"
			},
			{
				f: "milk",
				q: 200,
				u: "ml"
			},
			{
				f: "fruit",
				q: 150,
				u: "g"
			},
			{
				f: "walnuts",
				q: 15,
				u: "g"
			}
		],
		steps: [
			"Βράσε τη βρώμη με το γάλα σε χαμηλή φωτιά ~6′, ανακατεύοντας.",
			"Πρόσθεσε το μήλο κομμένο σε κύβους και λίγη κανέλα.",
			"Τα καρύδια μπαίνουν τελευταία, για να μείνουν τραγανά."
		],
		tip: "Ζεστό και χορταστικό για κρύα πρωινά — η βρώμη κρατά τον κορεσμό ώς το μεσημέρι."
	},
	{
		id: "scramble",
		name: "Αυγά με σπανάκι & φέτα",
		slot: "breakfast",
		time: 10,
		tags: [
			"fast",
			"highprotein",
			"veg"
		],
		ingredients: [
			{
				f: "egg",
				q: 2,
				u: "τεμ"
			},
			{
				f: "spinach",
				q: 80,
				u: "g"
			},
			{
				f: "feta",
				q: 25,
				u: "g"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 5,
				u: "ml"
			},
			{
				f: "fruit",
				q: 150,
				u: "g"
			}
		],
		steps: [
			"Σόταρε το σπανάκι στο ελαιόλαδο 2′ μέχρι να μαραθεί.",
			"Πρόσθεσε τα χτυπημένα αυγά και ανακάτευε σε χαμηλή φωτιά ~3′.",
			"Θρυμμάτισε τη φέτα από πάνω και σέρβιρε με ψωμί ολικής και ένα φρούτο εποχής."
		],
		tip: "Η φέτα αλατίζει το πιάτο — δεν χρειάζεται επιπλέον αλάτι."
	},
	{
		id: "fetaToast",
		name: "Τοστ ολικής με φέτα, ντομάτα & αγγούρι",
		slot: "breakfast",
		time: 5,
		tags: ["fast", "veg"],
		ingredients: [
			{
				f: "bread",
				q: 80,
				u: "g"
			},
			{
				f: "feta",
				q: 35,
				u: "g"
			},
			{
				f: "tomato",
				q: 100,
				u: "g"
			},
			{
				f: "cucumber",
				q: 60,
				u: "g"
			},
			{
				f: "olives",
				q: 10,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 5,
				u: "ml"
			},
			{
				f: "fruit",
				q: 150,
				u: "g"
			}
		],
		steps: [
			"Φρυγάνισε το ψωμί.",
			"Στρώσε τη φέτα και πρόσθεσε φέτες ντομάτα και αγγούρι.",
			"Ελαιόλαδο και ρίγανη από πάνω, και ένα φρούτο εποχής στο πλάι."
		],
		tip: "Πρωινό χωρίς μαγείρεμα — ταιριάζει όταν βιάζεστε για το σχολείο."
	},
	{
		id: "lentils",
		name: "Φακές, σαλάτα & φέτα",
		slot: "lunch",
		time: 35,
		tags: [
			"legume",
			"batch",
			"veg"
		],
		ingredients: [
			{
				f: "lentils",
				q: 95,
				u: "g"
			},
			{
				f: "carrot",
				q: 40,
				u: "g"
			},
			{
				f: "onion",
				q: 30,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 12,
				u: "ml"
			},
			{
				f: "tomato",
				q: 120,
				u: "g"
			},
			{
				f: "cucumber",
				q: 60,
				u: "g"
			},
			{
				f: "feta",
				q: 30,
				u: "g"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			}
		],
		steps: [
			"Βράσε τις φακές με καρότο και κρεμμύδι ~25′.",
			"Άφησε να τραβήξουν και πρόσθεσε ελαιόλαδο εκτός φωτιάς.",
			"Σέρβιρε με ντομάτα, αγγούρι, φέτα και μία φέτα ψωμί."
		],
		tip: "Μαγείρεψε διπλή ποσότητα: κρατά 3 ημέρες στο ψυγείο και μπαίνει σε ταπεράκι."
	},
	{
		id: "chickenTray",
		name: "Κοτόπουλο λεμονάτο, πατάτα & σαλάτα",
		slot: "lunch",
		time: 45,
		tags: ["highprotein", "batch"],
		ingredients: [
			{
				f: "chicken",
				q: 200,
				u: "g"
			},
			{
				f: "potato",
				q: 250,
				u: "g"
			},
			{
				f: "lemon",
				q: .25,
				u: "τεμ"
			},
			{
				f: "oliveOil",
				q: 12,
				u: "ml"
			},
			{
				f: "lettuce",
				q: 80,
				u: "g"
			},
			{
				f: "cucumber",
				q: 80,
				u: "g"
			}
		],
		steps: [
			"Σε ταψί: κοτόπουλο, πατάτες, λεμόνι, ελαιόλαδο, ρίγανη.",
			"Ψήσε 40′ στους 200°C.",
			"Σέρβιρε με φρέσκια σαλάτα στο πλάι."
		],
		tip: "Ένα ταψί = δύο γεύματα. Το δεύτερο κρυώνει και μπαίνει σε ταπεράκι για αύριο."
	},
	{
		id: "chickenRice",
		name: "Κοτόπουλο με ρύζι & λαχανικά στο φούρνο",
		slot: "lunch",
		time: 50,
		tags: ["highprotein", "batch"],
		ingredients: [
			{
				f: "chicken",
				q: 180,
				u: "g"
			},
			{
				f: "rice",
				q: 85,
				u: "g"
			},
			{
				f: "pepper",
				q: .5,
				u: "τεμ"
			},
			{
				f: "tomato",
				q: 100,
				u: "g"
			},
			{
				f: "onion",
				q: 30,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 12,
				u: "ml"
			}
		],
		steps: [
			"Σε ταψί: ρύζι, πιπεριά, ντομάτα, κρεμμύδι, ελαιόλαδο και ζεστό νερό — το νερό να καλύπτει το ρύζι.",
			"Ακούμπησε από πάνω το κοτόπουλο και ψήσε 45′ στους 190°C.",
			"Άφησέ το 5′ να ξεκουραστεί πριν το σερβίρεις."
		],
		tip: "Όλο το γεύμα σε ένα ταψί — λίγη δουλειά, λίγα πιάτα."
	},
	{
		id: "fishRice",
		name: "Ψάρι, ρύζι & χόρτα",
		slot: "lunch",
		time: 30,
		tags: ["fish", "highprotein"],
		ingredients: [
			{
				f: "fish",
				q: 180,
				u: "g"
			},
			{
				f: "rice",
				q: 85,
				u: "g"
			},
			{
				f: "greens",
				q: 200,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 12,
				u: "ml"
			},
			{
				f: "lemon",
				q: .25,
				u: "τεμ"
			}
		],
		steps: [
			"Βράσε το ρύζι και τα χόρτα χωριστά.",
			"Ψήσε το ψάρι στο τηγάνι ή στο φούρνο ~12′.",
			"Λεμόνι και ελαιόλαδο από πάνω, όχι μέσα στο μαγείρεμα."
		],
		tip: "Στόχος: ψάρι 2 φορές την εβδομάδα, με ποικιλία ειδών."
	},
	{
		id: "gigantes",
		name: "Γίγαντες & χωριάτικη",
		slot: "lunch",
		time: 50,
		tags: [
			"legume",
			"batch",
			"veg"
		],
		ingredients: [
			{
				f: "giantBeans",
				q: 95,
				u: "g"
			},
			{
				f: "tomato",
				q: 180,
				u: "g"
			},
			{
				f: "onion",
				q: 30,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 16,
				u: "ml"
			},
			{
				f: "cucumber",
				q: 80,
				u: "g"
			},
			{
				f: "feta",
				q: 30,
				u: "g"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			}
		],
		steps: [
			"Μούλιασε τους γίγαντες από το προηγούμενο βράδυ.",
			"Ψήσε με ντομάτα, κρεμμύδι, ελαιόλαδο ~45′ στους 180°C.",
			"Σέρβιρε με χωριάτικη σαλάτα και ψωμί."
		],
		tip: "Τα όσπρια είναι το φθηνότερο και πιο χορταστικό πιάτο της εβδομάδας."
	},
	{
		id: "revithia",
		name: "Ρεβίθια λεμονάτα στο φούρνο",
		slot: "lunch",
		time: 55,
		tags: [
			"legume",
			"batch",
			"veg"
		],
		ingredients: [
			{
				f: "chickpeas",
				q: 95,
				u: "g"
			},
			{
				f: "onion",
				q: 35,
				u: "g"
			},
			{
				f: "lemon",
				q: .25,
				u: "τεμ"
			},
			{
				f: "oliveOil",
				q: 15,
				u: "ml"
			},
			{
				f: "greens",
				q: 150,
				u: "g"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			}
		],
		steps: [
			"Μούλιασε τα ρεβίθια από το βράδυ.",
			"Ψήσε με κρεμμύδι και λεμόνι ~50′.",
			"Σέρβιρε με χόρτα και ψωμί στο πλάι."
		],
		tip: "Ψήσε σε μεγάλο ταψί — τρώγεται ζεστό ή κρύο την επόμενη μέρα."
	},
	{
		id: "fasolada",
		name: "Φασολάδα με ελαιόλαδο",
		slot: "lunch",
		time: 50,
		tags: ["legume", "batch"],
		ingredients: [
			{
				f: "whiteBeans",
				q: 95,
				u: "g"
			},
			{
				f: "carrot",
				q: 40,
				u: "g"
			},
			{
				f: "celery",
				q: 50,
				u: "g"
			},
			{
				f: "tomatoCanned",
				q: 100,
				u: "g"
			},
			{
				f: "onion",
				q: 30,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 12,
				u: "ml"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			}
		],
		steps: [
			"Μούλιασε τα φασόλια από το βράδυ.",
			"Βράσε με καρότο και σέλινο ~40′.",
			"Πρόσθεσε ντομάτα και ελαιόλαδο στο τέλος."
		],
		tip: "Κλασικό ελληνικό χειμωνιάτικο πιάτο — χορταστικό και οικονομικό."
	},
	{
		id: "gemista",
		name: "Γεμιστά με ρύζι & μυρωδικά",
		slot: "lunch",
		time: 70,
		tags: ["veg", "batch"],
		ingredients: [
			{
				f: "tomato",
				q: 2,
				u: "τεμ"
			},
			{
				f: "pepper",
				q: 1,
				u: "τεμ"
			},
			{
				f: "rice",
				q: 75,
				u: "g"
			},
			{
				f: "onion",
				q: 40,
				u: "g"
			},
			{
				f: "herbs",
				q: 10,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 16,
				u: "ml"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			}
		],
		steps: [
			"Άδειασε τα λαχανικά και κράτησε τη σάρκα.",
			"Ανακάτεψε ρύζι, κρεμμύδι, μυρωδικά, ελαιόλαδο.",
			"Γέμισε, σκέπασε και ψήσε 60′ στους 180°C."
		],
		tip: "Τρώγονται και κρύα — ιδανικά για ταπεράκι στο σχολείο."
	},
	{
		id: "meatballs",
		name: "Μπιφτέκια φούρνου με πατάτες",
		slot: "lunch",
		time: 45,
		tags: ["highprotein", "batch"],
		ingredients: [
			{
				f: "beef",
				q: 160,
				u: "g"
			},
			{
				f: "potato",
				q: 300,
				u: "g"
			},
			{
				f: "onion",
				q: 30,
				u: "g"
			},
			{
				f: "egg",
				q: .5,
				u: "τεμ"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			},
			{
				f: "tomato",
				q: 80,
				u: "g"
			}
		],
		steps: [
			"Ζύμωσε κιμά, κρεμμύδι, αυγό και μυρωδικά.",
			"Πλάσε μπιφτέκια, βάλε σε ταψί με πατάτες.",
			"Ψήσε 35′ στους 200°C."
		],
		tip: "Ψήσιμο στο φούρνο αντί τηγάνι: ίδια γεύση, λιγότερο λάδι."
	},
	{
		id: "yogSnack",
		name: "Γιαούρτι & φρούτο",
		slot: "snack",
		time: 2,
		tags: ["fast", "highprotein"],
		ingredients: [{
			f: "yogurt",
			q: 170,
			u: "g"
		}, {
			f: "fruit",
			q: 200,
			u: "g"
		}],
		steps: ["Σέρβιρε το γιαούρτι σε μπολ.", "Κόψε το φρούτο από πάνω."],
		tip: "Το πιο εύκολο σνακ του σπιτιού — μηδέν προετοιμασία."
	},
	{
		id: "bananaToast",
		name: "Μπανάνα & ψωμί με ταχίνι",
		slot: "snack",
		time: 3,
		tags: ["fast", "athlete"],
		ingredients: [
			{
				f: "banana",
				q: 1,
				u: "τεμ"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			},
			{
				f: "tahini",
				q: 15,
				u: "g"
			}
		],
		steps: ["Άλειψε το ταχίνι στο ψωμί.", "Κόψε τη μπανάνα από πάνω."],
		tip: "Γρήγορος υδατάνθρακας πριν από προπόνηση — το ταχίνι προσθέτει σίδηρο και ασβέστιο."
	},
	{
		id: "milkRecovery",
		name: "Αποκατάσταση: γάλα, μπανάνα & βρώμη",
		slot: "snack",
		time: 3,
		tags: ["athlete", "fast"],
		ingredients: [
			{
				f: "milk",
				q: 300,
				u: "ml"
			},
			{
				f: "banana",
				q: 1,
				u: "τεμ"
			},
			{
				f: "oats",
				q: 50,
				u: "g"
			}
		],
		steps: ["Χτύπησε όλα τα υλικά στο μπλέντερ.", "Πιες μέσα σε 60′ από την προπόνηση."],
		tip: "Υδατάνθρακες + πρωτεΐνη + υγρά σε ένα ποτήρι, για τις ημέρες με διπλή προπόνηση."
	},
	{
		id: "greekSalad",
		name: "Χωριάτικη με φέτα",
		slot: "snack",
		time: 7,
		tags: ["fast", "veg"],
		ingredients: [
			{
				f: "tomato",
				q: 150,
				u: "g"
			},
			{
				f: "cucumber",
				q: 80,
				u: "g"
			},
			{
				f: "pepper",
				q: 50,
				u: "g"
			},
			{
				f: "onion",
				q: 20,
				u: "g"
			},
			{
				f: "feta",
				q: 35,
				u: "g"
			},
			{
				f: "olives",
				q: 15,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			},
			{
				f: "bread",
				q: 50,
				u: "g"
			}
		],
		steps: [
			"Κόψε τα λαχανικά σε χοντρά κομμάτια.",
			"Πρόσθεσε φέτα, ελιές και ελαιόλαδο.",
			"Ρίγανη και ψωμί στο πλάι."
		],
		tip: "Το ελαιόλαδο μετριέται — μία κουταλιά της σούπας είναι 15 ml, όχι «ένα αυλάκι»."
	},
	{
		id: "fruitSalad",
		name: "Φρουτοσαλάτα εποχής",
		slot: "snack",
		time: 5,
		tags: ["fast", "veg"],
		ingredients: [{
			f: "fruit",
			q: 300,
			u: "g"
		}, {
			f: "lemon",
			q: .25,
			u: "τεμ"
		}],
		steps: ["Κόψε τα φρούτα σε μπολ.", "Λίγο λεμόνι για να μη μαυρίσουν."],
		tip: "Στόχος: τουλάχιστον 400 g φρούτων και λαχανικών την ημέρα (5 μερίδες) — ο ελάχιστος στόχος του ΠΟΥ."
	},
	{
		id: "smoothie",
		name: "Smoothie γιαουρτιού, φρούτου & βρώμης",
		slot: "snack",
		time: 3,
		tags: ["fast", "highprotein"],
		ingredients: [
			{
				f: "yogurt",
				q: 150,
				u: "g"
			},
			{
				f: "fruit",
				q: 150,
				u: "g"
			},
			{
				f: "oats",
				q: 40,
				u: "g"
			},
			{
				f: "honey",
				q: 10,
				u: "g"
			}
		],
		steps: ["Χτύπησε όλα τα υλικά στο μπλέντερ με λίγο παγωμένο νερό.", "Πιες αμέσως, κρύο."],
		tip: "Εύκολος τρόπος να φας πρωινό ή σνακ όταν δεν πεινάς — και χωρίς ζάχαρη."
	},
	{
		id: "yogHoney",
		name: "Γιαούρτι με μέλι, καρύδια & φρούτο",
		slot: "snack",
		time: 2,
		tags: ["fast", "highprotein"],
		ingredients: [
			{
				f: "yogurt",
				q: 200,
				u: "g"
			},
			{
				f: "honey",
				q: 10,
				u: "g"
			},
			{
				f: "walnuts",
				q: 15,
				u: "g"
			},
			{
				f: "fruit",
				q: 150,
				u: "g"
			}
		],
		steps: [
			"Σέρβιρε το γιαούρτι.",
			"Κόψε ένα φρούτο εποχής από πάνω.",
			"Μέλι και καρύδια στο τέλος."
		],
		tip: "Το μέλι μετριέται: 10 g είναι περίπου ενάμισι κουταλάκι του γλυκού, όχι ελεύθερη ροή."
	},
	{
		id: "omelet",
		name: "Ομελέτα λαχανικών & ψωμί",
		slot: "dinner",
		time: 12,
		tags: [
			"fast",
			"highprotein",
			"veg"
		],
		ingredients: [
			{
				f: "egg",
				q: 3,
				u: "τεμ"
			},
			{
				f: "spinach",
				q: 80,
				u: "g"
			},
			{
				f: "mushroom",
				q: 80,
				u: "g"
			},
			{
				f: "bread",
				q: 80,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			}
		],
		steps: [
			"Σόταρε τα λαχανικά 3′.",
			"Ρίξε τα χτυπημένα αυγά και άφησε να δέσουν σε χαμηλή φωτιά.",
			"Σέρβιρε με ψωμί ολικής."
		],
		tip: "Γρήγορο βραδινό όταν γυρίζετε αργά — έτοιμο σε 12 λεπτά."
	},
	{
		id: "dakos",
		name: "Ντάκος ολικής",
		slot: "dinner",
		time: 6,
		tags: ["fast", "veg"],
		ingredients: [
			{
				f: "paximadi",
				q: 1,
				u: "τεμ"
			},
			{
				f: "tomato",
				q: 200,
				u: "g"
			},
			{
				f: "feta",
				q: 40,
				u: "g"
			},
			{
				f: "olives",
				q: 20,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			}
		],
		steps: [
			"Βρέξε ελαφρά το παξιμάδι.",
			"Τρίψε τη ντομάτα από πάνω.",
			"Πρόσθεσε φέτα (ή ξινομυζήθρα), ελιές και ελαιόλαδο — χωρίς επιπλέον αλάτι."
		],
		tip: "Πλήρες βραδινό σε 6 λεπτά, χωρίς μαγείρεμα."
	},
	{
		id: "pastaVeg",
		name: "Ζυμαρικά ολικής, ντομάτα & λαχανικά",
		slot: "dinner",
		time: 20,
		tags: ["veg", "fast"],
		ingredients: [
			{
				f: "pasta",
				q: 95,
				u: "g"
			},
			{
				f: "tomatoCanned",
				q: 150,
				u: "g"
			},
			{
				f: "zucchini",
				q: 100,
				u: "g"
			},
			{
				f: "pepper",
				q: 50,
				u: "g"
			},
			{
				f: "hardcheese",
				q: 20,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			}
		],
		steps: [
			"Βράσε τα ζυμαρικά al dente.",
			"Σόταρε τα λαχανικά, πρόσθεσε την ντομάτα.",
			"Ένωσε, πασπάλισε τυρί και σέρβιρε."
		],
		tip: "Ιδανικό βραδινό πριν από αγώνα την επόμενη μέρα — υδατάνθρακες για τα αποθέματα."
	},
	{
		id: "chickenSouvlaki",
		name: "Σουβλάκι κοτόπουλο με πίτα ολικής",
		slot: "dinner",
		time: 25,
		tags: ["highprotein"],
		ingredients: [
			{
				f: "chicken",
				q: 170,
				u: "g"
			},
			{
				f: "pita",
				q: 1,
				u: "τεμ"
			},
			{
				f: "tomato",
				q: 80,
				u: "g"
			},
			{
				f: "onion",
				q: 25,
				u: "g"
			},
			{
				f: "yogurt",
				q: 60,
				u: "g"
			},
			{
				f: "lemon",
				q: .25,
				u: "τεμ"
			},
			{
				f: "oliveOil",
				q: 8,
				u: "ml"
			}
		],
		steps: [
			"Μαρινάρε το κοτόπουλο με λεμόνι, ελαιόλαδο και ρίγανη.",
			"Ψήσε σε δυνατή φωτιά 8′ ανά πλευρά.",
			"Τύλιξε σε πίτα με ντομάτα, κρεμμύδι και γιαούρτι αντί για έτοιμη σάλτσα."
		],
		tip: "Γιαούρτι αντί για έτοιμη σάλτσα: κρεμώδες, με πρωτεΐνη και χωρίς πρόσθετη ζάχαρη."
	},
	{
		id: "bakedFish",
		name: "Ψάρι πλακί με λαχανικά",
		slot: "dinner",
		time: 35,
		tags: [
			"fish",
			"highprotein",
			"veg"
		],
		ingredients: [
			{
				f: "fish",
				q: 180,
				u: "g"
			},
			{
				f: "tomato",
				q: 120,
				u: "g"
			},
			{
				f: "pepper",
				q: 60,
				u: "g"
			},
			{
				f: "onion",
				q: 40,
				u: "g"
			},
			{
				f: "potato",
				q: 200,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 12,
				u: "ml"
			},
			{
				f: "lemon",
				q: .25,
				u: "τεμ"
			}
		],
		steps: [
			"Στρώσε τα λαχανικά και τις πατάτες σε ταψί.",
			"Βάλε το ψάρι από πάνω με λεμόνι και ελαιόλαδο.",
			"Ψήσε 30′ στους 190°C."
		],
		tip: "Ελαφρύ και εύπεπτο βραδινό, πλούσιο σε πρωτεΐνη — καλή επιλογή για όλη την οικογένεια."
	},
	{
		id: "spinachRice",
		name: "Σπανακόρυζο με φέτα",
		slot: "dinner",
		time: 30,
		tags: ["veg", "fast"],
		ingredients: [
			{
				f: "spinach",
				q: 300,
				u: "g"
			},
			{
				f: "rice",
				q: 75,
				u: "g"
			},
			{
				f: "onion",
				q: 35,
				u: "g"
			},
			{
				f: "feta",
				q: 30,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 12,
				u: "ml"
			},
			{
				f: "lemon",
				q: .25,
				u: "τεμ"
			}
		],
		steps: [
			"Σόταρε το κρεμμύδι, πρόσθεσε το σπανάκι να μαραθεί.",
			"Ρίξε το ρύζι και νερό, σιγόβρασε 18′.",
			"Φέτα και λεμόνι στο σερβίρισμα."
		],
		tip: "Πηγή φυλλικού οξέος και σιδήρου. Λίγο λεμόνι στο πιάτο βοηθά την απορρόφηση του σιδήρου από φυτικές τροφές."
	},
	{
		id: "trahana",
		name: "Τραχανάς με φέτα",
		slot: "dinner",
		time: 20,
		tags: ["fast", "veg"],
		ingredients: [
			{
				f: "trahana",
				q: 80,
				u: "g"
			},
			{
				f: "tomato",
				q: 100,
				u: "g"
			},
			{
				f: "feta",
				q: 30,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			}
		],
		steps: [
			"Βράσε τον τραχανά σε νερό ή ζωμό ~12′.",
			"Πρόσθεσε τριμμένη ντομάτα.",
			"Φέτα και ελαιόλαδο στο σερβίρισμα."
		],
		tip: "Ζεστό, εύπεπτο βραδινό — καλό για κρύες μέρες. Ο τραχανάς είναι ήδη αλατισμένος: όχι επιπλέον αλάτι."
	},
	{
		id: "tahiniToast",
		name: "Ψωμί ολικής με ταχίνι, μέλι & μπανάνα",
		slot: "breakfast",
		time: 5,
		tags: ["fast", "veg"],
		ingredients: [
			{
				f: "bread",
				q: 70,
				u: "g"
			},
			{
				f: "tahini",
				q: 15,
				u: "g"
			},
			{
				f: "honey",
				q: 8,
				u: "g"
			},
			{
				f: "banana",
				q: 1,
				u: "τεμ"
			},
			{
				f: "milk",
				q: 200,
				u: "ml"
			}
		],
		steps: [
			"Άλειψε το ταχίνι στο ψημένο ψωμί.",
			"Πρόσθεσε μπανάνα σε ροδέλες και λίγο μέλι.",
			"Σέρβιρε με ένα ποτήρι γάλα."
		],
		tip: "Το ταχίνι δίνει ασβέστιο και σίδηρο· το γάλα συμπληρώνει την πρωτεΐνη."
	},
	{
		id: "yogOatsHoney",
		name: "Γιαούρτι με βρώμη, μέλι & καρύδια",
		slot: "breakfast",
		time: 5,
		tags: ["fast", "highprotein"],
		ingredients: [
			{
				f: "yogurt",
				q: 200,
				u: "g"
			},
			{
				f: "oats",
				q: 40,
				u: "g"
			},
			{
				f: "honey",
				q: 10,
				u: "g"
			},
			{
				f: "walnuts",
				q: 15,
				u: "g"
			},
			{
				f: "fruit",
				q: 150,
				u: "g"
			}
		],
		steps: [
			"Βάλε το γιαούρτι σε μπολ και πρόσθεσε τη βρώμη.",
			"Κόψε το φρούτο από πάνω.",
			"Ρίξε μέλι και καρύδια στο τέλος."
		],
		tip: "Πρωτεΐνη γιαουρτιού και υδατάνθρακες βρώμης κρατούν ενέργεια ώς το μεσημέρι."
	},
	{
		id: "veggieOmeletBread",
		name: "Ομελέτα με πιπεριά, μανιτάρια & ψωμί",
		slot: "breakfast",
		time: 12,
		tags: ["highprotein", "veg"],
		ingredients: [
			{
				f: "egg",
				q: 2,
				u: "τεμ"
			},
			{
				f: "pepper",
				q: 60,
				u: "g"
			},
			{
				f: "mushroom",
				q: 60,
				u: "g"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 5,
				u: "ml"
			}
		],
		steps: [
			"Σόταρε πιπεριά και μανιτάρια στο ελαιόλαδο 4′.",
			"Ρίξε τα χτυπημένα αυγά και ψήσε σε χαμηλή φωτιά.",
			"Σέρβιρε με ψωμί ολικής."
		],
		tip: "Τα λαχανικά από το πρωί βοηθούν να φτάσει η οικογένεια τις 5 μερίδες."
	},
	{
		id: "chickenPasta",
		name: "Ζυμαρικά ολικής με κοτόπουλο & ντομάτα",
		slot: "lunch",
		time: 25,
		tags: ["highprotein", "athlete"],
		ingredients: [
			{
				f: "pasta",
				q: 80,
				u: "g"
			},
			{
				f: "chicken",
				q: 120,
				u: "g"
			},
			{
				f: "tomatoCanned",
				q: 150,
				u: "g"
			},
			{
				f: "onion",
				q: 40,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			},
			{
				f: "hardcheese",
				q: 10,
				u: "g"
			}
		],
		steps: [
			"Σόταρε κρεμμύδι και κοτόπουλο σε κύβους στο ελαιόλαδο.",
			"Πρόσθεσε τη ντομάτα και σιγόβρασε 12′.",
			"Ανακάτεψε με τα βρασμένα ζυμαρικά και πασπάλισε τυρί."
		],
		tip: "Καλό γεύμα μετά από προπόνηση: υδατάνθρακες για αναπλήρωση και πρωτεΐνη για αποκατάσταση."
	},
	{
		id: "beefKritharaki",
		name: "Μοσχάρι κοκκινιστό με ρύζι",
		slot: "lunch",
		time: 60,
		tags: ["highprotein", "batch"],
		ingredients: [
			{
				f: "beef",
				q: 120,
				u: "g"
			},
			{
				f: "tomatoCanned",
				q: 150,
				u: "g"
			},
			{
				f: "onion",
				q: 50,
				u: "g"
			},
			{
				f: "carrot",
				q: 60,
				u: "g"
			},
			{
				f: "rice",
				q: 70,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			}
		],
		steps: [
			"Σοτάρισε το μοσχάρι με το κρεμμύδι στο ελαιόλαδο.",
			"Πρόσθεσε ντομάτα, καρότο και νερό· σιγόβρασε ~50′.",
			"Σέρβιρε με βρασμένο ρύζι."
		],
		tip: "Το κόκκινο κρέας δίνει σίδηρο που απορροφάται εύκολα· μία φορά την εβδομάδα αρκεί."
	},
	{
		id: "chickpeaSalad",
		name: "Σαλάτα ρεβιθιών με λαχανικά & φέτα",
		slot: "lunch",
		time: 10,
		tags: [
			"legume",
			"fast",
			"veg"
		],
		ingredients: [
			{
				f: "chickpeas",
				q: 60,
				u: "g"
			},
			{
				f: "tomato",
				q: 100,
				u: "g"
			},
			{
				f: "cucumber",
				q: 80,
				u: "g"
			},
			{
				f: "pepper",
				q: 50,
				u: "g"
			},
			{
				f: "feta",
				q: 30,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			},
			{
				f: "lemon",
				q: 20,
				u: "g"
			},
			{
				f: "bread",
				q: 50,
				u: "g"
			}
		],
		steps: [
			"Μούλιασε και βράσε τα ρεβίθια (οι ποσότητες είναι ξερό βάρος).",
			"Κόψε ντομάτα, αγγούρι και πιπεριά.",
			"Ανακάτεψε με ελαιόλαδο, λεμόνι και φέτα· σέρβιρε με ψωμί."
		],
		tip: "Το λεμόνι (βιταμίνη C) βοηθά την απορρόφηση του σιδήρου από τα όσπρια."
	},
	{
		id: "yogFruitNuts",
		name: "Γιαούρτι με φρούτο & καρύδια",
		slot: "snack",
		time: 3,
		tags: ["fast", "highprotein"],
		ingredients: [
			{
				f: "yogurt",
				q: 170,
				u: "g"
			},
			{
				f: "fruit",
				q: 120,
				u: "g"
			},
			{
				f: "walnuts",
				q: 10,
				u: "g"
			}
		],
		steps: ["Βάλε το γιαούρτι σε μπολ.", "Πρόσθεσε φρούτο και καρύδια."],
		tip: "Γρήγορο σνακ με πρωτεΐνη για το απόγευμα."
	},
	{
		id: "paximadiCheese",
		name: "Παξιμάδι με ντομάτα & τυρί",
		slot: "snack",
		time: 5,
		tags: ["fast", "veg"],
		ingredients: [
			{
				f: "paximadi",
				q: 40,
				u: "g"
			},
			{
				f: "tomato",
				q: 100,
				u: "g"
			},
			{
				f: "feta",
				q: 20,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 5,
				u: "ml"
			}
		],
		steps: ["Βρέξε ελαφρά το παξιμάδι.", "Τρίψε ντομάτα από πάνω και πρόσθεσε φέτα και ελαιόλαδο."],
		tip: "Η φέτα έχει αλάτι — μην προσθέσεις επιπλέον."
	},
	{
		id: "hummusVeg",
		name: "Χούμους με λαχανικά & πίτα",
		slot: "snack",
		time: 10,
		tags: ["legume", "veg"],
		ingredients: [
			{
				f: "chickpeas",
				q: 40,
				u: "g"
			},
			{
				f: "tahini",
				q: 10,
				u: "g"
			},
			{
				f: "lemon",
				q: 15,
				u: "g"
			},
			{
				f: "carrot",
				q: 60,
				u: "g"
			},
			{
				f: "cucumber",
				q: 60,
				u: "g"
			},
			{
				f: "pita",
				q: 40,
				u: "g"
			}
		],
		steps: [
			"Πολτοποίησε ρεβίθια, ταχίνι και λεμόνι με λίγο νερό.",
			"Κόψε καρότο και αγγούρι σε στικς.",
			"Σέρβιρε με πίτα."
		],
		tip: "Όσπρια και σε σνακ: φυτικές ίνες και πρωτεΐνη μαζί."
	},
	{
		id: "fishPotatoes",
		name: "Ψάρι στον φούρνο με πατάτες & λεμόνι",
		slot: "dinner",
		time: 35,
		tags: ["fish", "highprotein"],
		ingredients: [
			{
				f: "fish",
				q: 150,
				u: "g"
			},
			{
				f: "potato",
				q: 200,
				u: "g"
			},
			{
				f: "lemon",
				q: 20,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			},
			{
				f: "herbs",
				q: 3,
				u: "g"
			},
			{
				f: "greens",
				q: 100,
				u: "g"
			}
		],
		steps: [
			"Ψήσε τις πατάτες σε κομμάτια με ελαιόλαδο 15′ στους 200°C.",
			"Πρόσθεσε το ψάρι με λεμόνι και μυρωδικά· ψήσε ~15′ ακόμη.",
			"Σέρβιρε με βραστά χόρτα."
		],
		tip: "Ψάρι δύο φορές την εβδομάδα είναι η σύσταση EFSA για ωμέγα-3."
	},
	{
		id: "zucchiniFritters",
		name: "Κολοκυθάκια με αυγά & φέτα στο τηγάνι",
		slot: "dinner",
		time: 15,
		tags: ["veg", "fast"],
		ingredients: [
			{
				f: "zucchini",
				q: 200,
				u: "g"
			},
			{
				f: "egg",
				q: 2,
				u: "τεμ"
			},
			{
				f: "feta",
				q: 25,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			},
			{
				f: "bread",
				q: 60,
				u: "g"
			}
		],
		steps: [
			"Σόταρε τα κολοκυθάκια σε ροδέλες στο ελαιόλαδο 6′.",
			"Ρίξε τα χτυπημένα αυγά και τη φέτα, ανακάτευε σε χαμηλή φωτιά.",
			"Σέρβιρε με ψωμί ολικής."
		],
		tip: "Ελαφρύ βραδινό με πρωτεΐνη, χωρίς τηγάνισμα σε πολύ λάδι."
	},
	{
		id: "beansSalad",
		name: "Φασόλια σαλάτα με κρεμμύδι & μαϊντανό",
		slot: "dinner",
		time: 10,
		tags: [
			"legume",
			"fast",
			"veg"
		],
		ingredients: [
			{
				f: "whiteBeans",
				q: 70,
				u: "g"
			},
			{
				f: "onion",
				q: 30,
				u: "g"
			},
			{
				f: "herbs",
				q: 5,
				u: "g"
			},
			{
				f: "tomato",
				q: 100,
				u: "g"
			},
			{
				f: "oliveOil",
				q: 10,
				u: "ml"
			},
			{
				f: "lemon",
				q: 15,
				u: "g"
			},
			{
				f: "bread",
				q: 50,
				u: "g"
			}
		],
		steps: [
			"Μούλιασε και βράσε τα φασόλια (οι ποσότητες είναι ξερό βάρος).",
			"Πρόσθεσε ψιλοκομμένο κρεμμύδι, μαϊντανό και ντομάτα.",
			"Ντύσε με ελαιόλαδο και λεμόνι· σέρβιρε με ψωμί."
		],
		tip: "Γρήγορο βραδινό οσπρίων με ίνες που κρατούν τον κορεσμό."
	}
].map(deriveRecipe);
var ROTATION = [
	[
		[
			"oats",
			"lentils",
			"yogSnack",
			"pastaVeg"
		],
		[
			"eggs",
			"chickenTray",
			"milkRecovery",
			"dakos"
		],
		[
			"porridge",
			"fishRice",
			"bananaToast",
			"spinachRice"
		],
		[
			"fetaToast",
			"revithia",
			"milkRecovery",
			"omelet"
		],
		[
			"oats",
			"gigantes",
			"fruitSalad",
			"bakedFish"
		],
		[
			"scramble",
			"gemista",
			"smoothie",
			"chickenSouvlaki"
		],
		[
			"oats",
			"meatballs",
			"yogHoney",
			"trahana"
		]
	],
	[
		[
			"porridge",
			"fasolada",
			"greekSalad",
			"omelet"
		],
		[
			"oats",
			"chickenRice",
			"milkRecovery",
			"spinachRice"
		],
		[
			"fetaToast",
			"fishRice",
			"bananaToast",
			"pastaVeg"
		],
		[
			"eggs",
			"gemista",
			"milkRecovery",
			"trahana"
		],
		[
			"oats",
			"revithia",
			"fruitSalad",
			"bakedFish"
		],
		[
			"scramble",
			"meatballs",
			"smoothie",
			"chickenSouvlaki"
		],
		[
			"porridge",
			"gigantes",
			"yogHoney",
			"dakos"
		]
	],
	[
		[
			"oats",
			"lentils",
			"yogSnack",
			"trahana"
		],
		[
			"scramble",
			"chickenTray",
			"milkRecovery",
			"pastaVeg"
		],
		[
			"oats",
			"fasolada",
			"greekSalad",
			"omelet"
		],
		[
			"porridge",
			"fishRice",
			"milkRecovery",
			"spinachRice"
		],
		[
			"fetaToast",
			"gemista",
			"bananaToast",
			"bakedFish"
		],
		[
			"eggs",
			"meatballs",
			"smoothie",
			"chickenSouvlaki"
		],
		[
			"oats",
			"gigantes",
			"yogHoney",
			"dakos"
		]
	],
	[
		[
			"fetaToast",
			"fasolada",
			"yogSnack",
			"spinachRice"
		],
		[
			"scramble",
			"chickenRice",
			"milkRecovery",
			"pastaVeg"
		],
		[
			"oats",
			"revithia",
			"greekSalad",
			"trahana"
		],
		[
			"eggs",
			"fishRice",
			"milkRecovery",
			"dakos"
		],
		[
			"porridge",
			"gemista",
			"fruitSalad",
			"bakedFish"
		],
		[
			"oats",
			"meatballs",
			"smoothie",
			"chickenSouvlaki"
		],
		[
			"fetaToast",
			"lentils",
			"yogHoney",
			"omelet"
		]
	]
];
var DOW = [
	"Δευτέρα",
	"Τρίτη",
	"Τετάρτη",
	"Πέμπτη",
	"Παρασκευή",
	"Σάββατο",
	"Κυριακή"
];
var PLAN_28 = ROTATION.flatMap((week, wi) => week.map((slots, di) => ({
	day: wi * 7 + di + 1,
	week: wi + 1,
	dow: DOW[di],
	breakfast: slots[0],
	lunch: slots[1],
	snack: slots[2],
	dinner: slots[3]
})));
var IRON_HIGH_MG = 4.2;
RECIPES.filter((r) => r.micro.fe >= IRON_HIGH_MG).map((r) => r.id);
//#endregion
//#region src/engine/data.js
/**
* ZENITH PRO · data layer
* ---------------------------------------------------------------------------
* All content lives here so the app ships with zero network dependencies and
* works fully offline. Nothing in this file performs I/O.
*
* Where the numbers come from
*   • What is IN the food lives in foods.js (USDA FoodData Central, per 100 g).
*   • Recipes (recipes.js) are quantified lines of those foods; their macros and
*     micronutrients are DERIVED from grams, never typed.
*   • Energy is always derived from macros with the EU labelling factors (protein 4,
*     available carbohydrate 4, fat 9, fibre 2 kcal/g) by `nutrition-engine.js`, never
*     stored separately, so the numbers can never disagree with each other. See
*     METHOD for the citations.
*/
var FAMILY = [
	{
		id: "mother",
		name: "Αναστασία",
		relation: "Μητέρα",
		role: "Υγεία & σταδιακή απώλεια λίπους",
		sex: "f",
		age: 51,
		height: 167,
		weight: 87,
		activityFactor: 1.4,
		goal: "gradual_fat_loss",
		athlete: false,
		accent: "#0E9F6E",
		notes: "Στόχος ρυθμού, όχι ταχύτητας."
	},
	{
		id: "father",
		name: "Αλέξης",
		relation: "Πατέρας",
		role: "Συντήρηση & καρδιομεταβολική υγεία",
		sex: "m",
		age: 54,
		height: 178,
		weight: 78,
		activityFactor: 1.4,
		goal: "maintain",
		athlete: false,
		accent: "#2F6FED",
		notes: "Προσοχή στο αλάτι."
	},
	{
		id: "daughter",
		name: "Αλεξάνδρα",
		relation: "Κόρη",
		role: "Ανάπτυξη & ενέργεια",
		sex: "f",
		age: 17,
		height: 165,
		weight: 52,
		activityFactor: 1.6,
		goal: "growth",
		athlete: false,
		accent: "#D9457A",
		notes: "Ποικιλία & σίδηρος."
	},
	{
		id: "son",
		name: "Δημήτρης",
		relation: "Γιος",
		role: "Basketball · απόδοση & αποκατάσταση",
		sex: "m",
		age: 15,
		height: 181,
		weight: 65,
		activityFactor: 1.8,
		goal: "performance",
		athlete: true,
		accent: "#D98A16",
		notes: "Διπλές προπονήσεις Τρ/Πε."
	}
];
var TRAINING_LOADS = [
	["rest", "Ξεκούραση"],
	["light", "Ελαφριά"],
	["normal", "Κανονική"],
	["hard", "Σκληρή"],
	["game", "Αγώνας"],
	["tournament", "Τουρνουά / διπλή"]
];
var GOALS = [
	["maintain", "Συντήρηση"],
	["gradual_fat_loss", "Σταδιακή απώλεια λίπους (μόνο ενήλικες)"],
	["growth", "Ανάπτυξη"],
	["performance", "Απόδοση"]
];
var SLOTS = [
	"breakfast",
	"lunch",
	"snack",
	"dinner"
];
var SLOT_LABEL = {
	breakfast: "Πρωινό",
	lunch: "Μεσημεριανό",
	snack: "Σνακ",
	dinner: "Βραδινό"
};
var SLOT_TIME = {
	breakfast: "07:30",
	lunch: "13:30",
	snack: "17:30",
	dinner: "20:30"
};
var AISLES = [
	{
		id: "produce",
		label: "Οπωροπωλείο",
		icon: "leaf"
	},
	{
		id: "protein",
		label: "Κρεοπωλείο & ψάρια",
		icon: "drumstick"
	},
	{
		id: "dairy",
		label: "Γαλακτοκομικά & αυγά",
		icon: "milk"
	},
	{
		id: "pantry",
		label: "Ξηρά, λάδια & κονσέρβες",
		icon: "jar"
	},
	{
		id: "bakery",
		label: "Αρτοποιείο",
		icon: "bread"
	},
	{
		id: "frozen",
		label: "Κατεψυγμένα",
		icon: "snowflake"
	}
];
var SOURCES = [
	{
		id: "efsa",
		verified: "2026-09-30",
		label: "EFSA — Summary of Dietary Reference Values (2017)",
		url: "https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf",
		used: "Τιμές αναφοράς ανά ηλικία και φύλο: ίνες, ασβέστιο, σίδηρος, νερό και πρωτεΐνη· μέσες ανάγκες ενέργειας."
	},
	{
		id: "who",
		verified: "2026-09-30",
		label: "WHO — Healthy diet (fact sheet)",
		url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
		used: "Αλάτι κάτω από 5 g (2 g νατρίου) την ημέρα, τουλάχιστον 400 g φρούτων και λαχανικών, τουλάχιστον 25 g ίνες."
	},
	{
		id: "usda",
		verified: "2026-09-30",
		label: "USDA FoodData Central — SR Legacy",
		url: "https://fdc.nal.usda.gov/",
		used: "Σύσταση κάθε τροφίμου ανά 100 g: πρωτεΐνη, υδατάνθρακες, λίπος, ίνες, νάτριο, σίδηρος, ασβέστιο."
	},
	{
		id: "eu1169",
		verified: "2026-09-30",
		label: "Regulation (EU) No 1169/2011 — energy conversion factors & reference intakes",
		url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1169",
		used: "Συντελεστές ενέργειας όπως στις ετικέτες (4/4/9 kcal/g, ίνες 2 kcal/g) και τιμές αναφοράς της ΕΕ (σίδηρος 14 mg, ασβέστιο 800 mg) για τα σήματα «πλούσιο σε…»."
	},
	{
		id: "mifflin",
		verified: "2026-09-30",
		label: "Mifflin & St Jeor (1990) — resting energy expenditure",
		url: "https://pubmed.ncbi.nlm.nih.gov/2305711/",
		used: "Εξίσωση ενέργειας ηρεμίας για ενήλικες."
	},
	{
		id: "schofield",
		verified: "2026-09-30",
		label: "Schofield (1985) · FAO/WHO/UNU — Energy and protein requirements",
		url: "https://www.fao.org/4/aa040e/aa040e00.htm",
		used: "Εξίσωση ενέργειας ηρεμίας για ηλικίες 10–18 ετών."
	},
	{
		id: "cdc",
		verified: "2026-09-30",
		label: "CDC — Child & teen BMI categories",
		url: "https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html",
		used: "Γιατί το BMI ενηλίκων δεν ισχύει κάτω των 20 ετών: χρησιμοποιούνται ποσοστιαίες θέσεις BMI ανά ηλικία και φύλο."
	},
	{
		id: "acsm",
		verified: "2026-09-30",
		label: "ACSM/AND/DC (2016) — Nutrition and athletic performance",
		url: "https://pubmed.ncbi.nlm.nih.gov/26891166/",
		used: "Υδατάνθρακες πριν και μετά την προπόνηση (1–4 g/kg πριν), πρωτεΐνη μετά την άσκηση, αναπλήρωση υγρών 125–150%."
	},
	{
		id: "issn",
		verified: "2026-09-30",
		label: "ISSN position stand (2017) — Protein and exercise",
		url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
		used: "Πρωτεΐνη αθλητών 1,4–2,0 g/kg την ημέρα· η εφαρμογή σχεδιάζει στο 1,4–1,8 g/kg."
	},
	{
		id: "sda",
		verified: "2026-09-30",
		label: "Sports Dietitians Australia (2014) — The adolescent athlete",
		url: "https://pubmed.ncbi.nlm.nih.gov/24668620/",
		used: "Αθλητική διατροφή εφήβων: η επάρκεια ενέργειας προηγείται, όχι ο περιορισμός."
	},
	{
		id: "reds",
		verified: "2026-09-30",
		label: "IOC consensus (2023) — Relative Energy Deficiency in Sport",
		url: "https://pubmed.ncbi.nlm.nih.gov/37752011/",
		used: "Διαθεσιμότητα ενέργειας σε νεαρούς αθλητές."
	},
	{
		id: "hall",
		verified: "2026-09-30",
		label: "Hall et al. (2011) — Effect of energy imbalance on bodyweight",
		url: "https://pubmed.ncbi.nlm.nih.gov/21872751/",
		used: "Το βάρος αλλάζει σταδιακά με το ενεργειακό ισοζύγιο· γι’ αυτό κρίνουμε τάση εβδομάδων και όχι μία μέτρηση."
	}
];
var METHOD = [
	{
		icon: "flame",
		title: "Ενέργεια ενηλίκων",
		body: "Εξίσωση Mifflin–St Jeor για την ενέργεια ηρεμίας × επίπεδο δραστηριότητας (1,4 · 1,6 · 1,8 · 2,0, όπως στην EFSA). Σταδιακή απώλεια λίπους = −12% της συντήρησης, δηλαδή περίπου 250 kcal την ημέρα. Εμφανίζεται πάντα ως εύρος ±6%, ποτέ ως ένας «μαγικός» αριθμός."
	},
	{
		icon: "users",
		title: "Ενέργεια εφήβων",
		body: "Εξίσωση Schofield (FAO/WHO/UNU) για ηλικίες 10–18 × επίπεδο δραστηριότητας — για αθλητή, ανάλογα με το φορτίο προπόνησης. Το εύρος είναι ±10% και συμφωνεί με τις Μέσες Ανάγκες της EFSA για την ηλικία. Δεν εφαρμόζεται ποτέ έλλειμμα σε ανήλικο προφίλ και δεν εμφανίζεται κατηγορία BMI ενηλίκων κάτω των 20 ετών."
	},
	{
		icon: "target",
		title: "Πώς κλιμακώνονται οι μερίδες",
		body: "Κάθε συνταγή είναι γραμμένη σε γραμμάρια υλικών για μία μερίδα αναφοράς. Κάθε υλικό ανήκει σε ομάδα πιάτου (πρωτεΐνη, υδατάνθρακες, λιπαρά, λαχανικά) και κλιμακώνεται με τον συντελεστή του κάθε μέλους — π.χ. λιγότερο ρύζι και περισσότερα λαχανικά για όποιον προσέχει τη ζυγαριά. Το μέγεθος του πιάτου προσαρμόζεται ώστε ο κύκλος των 28 ημερών να πέφτει στο κέντρο της εκτιμώμενης ενεργειακής ανάγκης: ποτέ κάτω από ×1,0, ποτέ για ενήλικα σε πρόγραμμα απώλειας και με ανώτατο ×1,5."
	},
	{
		icon: "leaf",
		title: "Θρεπτικά από τα υλικά",
		body: "Ενέργεια, macros, ίνες, αλάτι, σίδηρος και ασβέστιο υπολογίζονται από τα γραμμάρια κάθε υλικού × τη σύστασή του (USDA FoodData Central). Η ενέργεια βγαίνει πάντα από τα macros με τους συντελεστές των ετικετών της ΕΕ: πρωτεΐνη και υδατάνθρακες 4, λιπαρά 9, φυτικές ίνες 2 kcal/g (οι υδατάνθρακες δεν περιλαμβάνουν τις ίνες). Συγκρίνονται με τιμές αναφοράς της EFSA (ίνες, σίδηρος, ασβέστιο) και του ΠΟΥ (αλάτι κάτω από 5 g). Το αλάτι που προσθέτεις εσύ στο μαγείρεμα δεν υπολογίζεται."
	},
	{
		icon: "droplet",
		title: "Ενυδάτωση",
		body: "Ο στόχος ροφημάτων είναι το 80% της Επαρκούς Πρόσληψης νερού της EFSA για την ηλικία και το φύλο (2,0 L για γυναίκες και κορίτσια 14+, 2,5 L για άνδρες και αγόρια 14+) — το υπόλοιπο προέρχεται συνήθως από τα τρόφιμα. Οι αθλητές προσθέτουν υγρά για την προπόνηση. Δεν είναι ιατρική συνταγή: η ανάγκη αλλάζει με τη ζέστη, την εφίδρωση, την ασθένεια και τα φάρμακα."
	},
	{
		icon: "alert",
		title: "Τι δεν κάνει η εφαρμογή",
		body: "Δεν μετράει κατανάλωση χωρίς επιβεβαίωση, δεν βάζει αυθαίρετο «health score», δεν δίνει στόχο απώλειας βάρους σε ανήλικο και δεν αντικαθιστά ιατρική φροντίδα. Όλα τα νούμερα είναι εκτιμήσεις προγραμματισμού, όχι μετρήσεις."
	}
];
var SAFETY = [
	"Εκπαιδευτικό εργαλείο ευεξίας — δεν αποτελεί ιατρική φροντίδα, διάγνωση ή θεραπεία.",
	"Κανένα έλλειμμα θερμίδων και καμία κατηγορία BMI ενηλίκων σε προφίλ κάτω των 20 ετών.",
	"Το μέγεθος πιάτου ενός μέλους δεν πέφτει ποτέ κάτω από τη μερίδα αναφοράς για να «πιάσει» έναν στόχο.",
	"Οι μετρήσεις αξιολογούνται ως τάση 3–4 εβδομάδων, ποτέ μεμονωμένα.",
	"Τα δεδομένα μένουν στη συσκευή. Δεν υπάρχει λογαριασμός, διακομιστής ή παρακολούθηση.",
	"Σε εγκυμοσύνη, διαβήτη, νεφρική ή καρδιακή νόσο, διατροφική διαταραχή ή φαρμακευτική αγωγή: συμβουλέψου επαγγελματία υγείας πριν αλλάξεις τη διατροφή σου."
];
var GLOSSARY = [
	["Macros", "Οι τρεις θερμιδογόνες ομάδες: πρωτεΐνη (4 kcal/g), υδατάνθρακες (4 kcal/g, χωρίς τις ίνες) και λιπαρά (9 kcal/g). Οι φυτικές ίνες μετρούν 2 kcal/g."],
	["Μερίδα αναφοράς", "Η ποσότητα ενός υλικού για έναν μέσο ενήλικα, πριν την προσαρμογή στο μέλος."],
	["Μέγεθος πιάτου", "Πόσο μεγάλο είναι το πιάτο κάποιου σε σχέση με τη μερίδα αναφοράς, ώστε το πλάνο να καλύπτει την εκτιμώμενη ενέργειά του (×1,0 έως ×1,5)."],
	["Φορτίο προπόνησης", "Πόσο απαιτητική είναι η σημερινή προπόνηση. Αλλάζει υδατάνθρακες και υγρά — ποτέ τις θερμίδες ανήλικου προς τα κάτω."],
	["Επίπεδο δραστηριότητας (PAL)", "Πολλαπλασιαστής της ενέργειας ηρεμίας: 1,4 = χαμηλή δραστηριότητα, 1,6 = μέτρια, 1,8 = δραστήρια, 2,0 = πολύ δραστήρια."],
	["Επαρκής Πρόσληψη (AI) · Πρόσληψη Αναφοράς (PRI)", "Τιμές της EFSA για το τι πρέπει να παίρνει καθημερινά σχεδόν όλος ο πληθυσμός μιας ηλικίας και φύλου. Το «όριο» για το αλάτι είναι αντίστροφο: ό,τι δεν πρέπει να ξεπερνάς."],
	["Συντελεστές ενέργειας", "Πώς τα macros γίνονται θερμίδες, όπως στις ετικέτες των τροφίμων της ΕΕ: 4/4/9 kcal ανά γραμμάριο και 2 για τις ίνες."],
	["RED-S", "Σχετική ανεπάρκεια ενέργειας στον αθλητισμό — κίνδυνος σε νεαρούς αθλητές με χαμηλή ενεργειακή διαθεσιμότητα."]
];
var foodList = Object.values(FOODS);
foodList.length, foodList.filter((f) => f.fdc && !f.proxy).length, foodList.filter((f) => f.fdc && f.proxy).length, foodList.filter((f) => f.approx).length;
//#endregion
//#region src/engine/dates.js
/**
* ZENITH PRO · calendar
* ---------------------------------------------------------------------------
* Pure date helpers. No DOM, no storage — imported by the engine, the UI and the
* tests alike.
*
* Why this file exists: everything the household sees — today's meals, the plan
* week, the shopping list — is a function of the calendar date, so a one-day
* error here is an error everywhere. The rule that keeps it correct is:
*
*   COUNT CALENDAR DAYS, NEVER ELAPSED MILLISECONDS.
*
* A local "midnight to midnight" span is 23 or 25 hours on a clock-change day,
* so `Math.floor(ms / 86400000)` under-counts by one for the whole summer in
* Greece. `dayNumber()` reads the year/month/day fields and counts in UTC, where
* every day is exactly 24 hours long.
*/
var MS_PER_DAY = 864e5;
var CYCLE_EPOCH = "2024-01-01";
var pad = (n) => String(n).padStart(2, "0");
/** Local calendar date as `YYYY-MM-DD`. */
function localDateKey(d = /* @__PURE__ */ new Date()) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Local midnight of a `YYYY-MM-DD` key. */
function dateFromKey(key) {
	const [y, m, d] = String(key).split("-").map(Number);
	return new Date(y, (m || 1) - 1, d || 1);
}
/** Integer days since 1970-01-01 of a calendar date (a key or a Date). DST-proof. */
function dayNumber(input) {
	if (typeof input === "string") {
		const [y, m, d] = input.split("-").map(Number);
		return Math.round(Date.UTC(y, (m || 1) - 1, d || 1) / MS_PER_DAY);
	}
	const d = input instanceof Date ? input : new Date(input);
	return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
}
/** `key` moved by `n` calendar days. */
function addDays(key, n) {
	const d = dateFromKey(key);
	d.setDate(d.getDate() + n);
	return localDateKey(d);
}
/** Monday = 0 … Sunday = 6, for a Date or a key. */
function weekdayIndex(input = /* @__PURE__ */ new Date()) {
	return ((typeof input === "string" ? dateFromKey(input) : input).getDay() + 6) % 7;
}
/** Monday of the week containing `input` (a Date or a key), as a date key. */
function mondayOf(input = /* @__PURE__ */ new Date()) {
	const d = typeof input === "string" ? dateFromKey(input) : input;
	const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	copy.setDate(copy.getDate() - weekdayIndex(copy));
	return localDateKey(copy);
}
/**
* 1..28 position in the meal rotation. Anchored to a fixed Monday so it is
* continuous across new year (the pre-v13 code re-anchored on 1 January) and
* so every Monday is the first day of a rotation week.
*/
function cycleDayIndex(input = /* @__PURE__ */ new Date()) {
	return ((dayNumber(input) - dayNumber(CYCLE_EPOCH)) % 28 + 28) % 28 + 1;
}
/**
* Energy conversion factors (kcal per gram) as EU food labels apply them
* (Regulation (EU) 1169/2011, Annex XIV): protein 4, AVAILABLE carbohydrate 4, fat 9,
* dietary fibre 2. The classic Atwater general factors are the first three; counting
* fibre at 2 rather than folding it into carbohydrate at 4 is what keeps the energy
* of a bean or whole-grain dish in line with the label on the packet.
*/
var ATWATER = {
	protein: 4,
	carb: 4,
	fat: 9,
	fibre: 2
};
new Intl.NumberFormat("el-GR", { maximumFractionDigits: 1 });
var round = (n, dp = 0) => {
	const f = 10 ** dp;
	return Math.round(n * f) / f;
};
/** Energy from displayed amounts: `c` is available carbohydrate, `fib` is fibre (g). */
function kcalFromMacros({ p = 0, c = 0, f = 0, fib = 0 }) {
	return Math.round(ATWATER.protein * p + ATWATER.carb * c + ATWATER.fat * f + ATWATER.fibre * fib);
}
function isMinor(profile) {
	return Number(profile.age) < 18;
}
function canUseAdultBmi(profile) {
	return Number(profile.age) >= 20;
}
function bmi(profile) {
	const h = Number(profile.height) / 100;
	const w = Number(profile.weight);
	if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
	return +(w / (h * h)).toFixed(1);
}
function adultBmiLabel(profile) {
	if (!canUseAdultBmi(profile)) return null;
	const value = bmi(profile);
	if (value == null) return null;
	if (value < 18.5) return "Κάτω από το εύρος ενηλίκων";
	if (value < 25) return "Εντός εύρους ενηλίκων";
	if (value < 30) return "Πάνω από το εύρος ενηλίκων";
	return "Υψηλό εύρος BMI ενηλίκων";
}
function mifflin(profile) {
	const sexConstant = profile.sex === "m" ? 5 : -161;
	return 10 * Number(profile.weight) + 6.25 * Number(profile.height) - 5 * Number(profile.age) + sexConstant;
}
function adultEnergy(profile) {
	const bmr = mifflin(profile);
	const activity = Number(profile.activityFactor || 1.4);
	const maintenance = Math.round(bmr * activity);
	let center = maintenance;
	let note = "Εκτιμώμενο εύρος συντήρησης";
	if (profile.goal === "gradual_fat_loss") {
		center = Math.round(maintenance * .88);
		note = "Ήπιο εκτιμώμενο έλλειμμα. Προσάρμοσε μόνο από τάση πολλών εβδομάδων, πείνα και λειτουργικότητα — όχι από μία μέτρηση.";
	}
	return {
		lower: Math.max(1200, Math.round(center * .94 / 50) * 50),
		upper: Math.round(center * 1.06 / 50) * 50,
		maintenance,
		note
	};
}
function adolescentEnergy(profile, trainingLoad = "normal") {
	const weight = Number(profile.weight);
	const base = profile.sex === "m" ? 17.686 * weight + 658.2 : 13.384 * weight + 692.6;
	const athleteFactors = {
		rest: 1.45,
		light: 1.6,
		normal: 1.75,
		hard: 1.95,
		game: 2.05,
		tournament: 2.15
	};
	const factor = profile.athlete ? athleteFactors[trainingLoad] || athleteFactors.normal : Number(profile.activityFactor || 1.55);
	const center = Math.round(base * factor);
	return {
		lower: Math.round(center * .9 / 50) * 50,
		upper: Math.round(center * 1.1 / 50) * 50,
		maintenance: center,
		note: "Ευρεία εκτίμηση ανάπτυξης/απόδοσης — ποτέ στόχος περιορισμού θερμίδων για ανήλικο."
	};
}
function energyRange(profile, trainingLoad = "normal") {
	return isMinor(profile) ? adolescentEnergy(profile, trainingLoad) : adultEnergy(profile);
}
function proteinRange(profile) {
	const weight = Number(profile.weight);
	if (isMinor(profile)) {
		if (profile.athlete) return {
			min: Math.round(1.4 * weight),
			max: Math.round(1.8 * weight),
			note: "Εύρος σχεδιασμού με βάση την τροφή. Η συνολική επάρκεια ενέργειας προηγείται."
		};
		return {
			min: Math.round(1 * weight),
			max: Math.round(1.3 * weight),
			note: "Εύρος υποστήριξης ανάπτυξης — χωρίς ανάγκη συμπληρωμάτων."
		};
	}
	if (profile.goal === "gradual_fat_loss") return {
		min: Math.round(1.2 * weight),
		max: Math.round(1.6 * weight),
		note: "Εύρος για κορεσμό και διατήρηση μυϊκής μάζας."
	};
	if (profile.athlete) return {
		min: Math.round(1.4 * weight),
		max: Math.round(1.8 * weight),
		note: "Εύρος υποστήριξης προπόνησης."
	};
	return {
		min: Math.round(1 * weight),
		max: Math.round(1.3 * weight),
		note: "Γενικό εύρος υγιούς ενήλικα."
	};
}
/**
* EFSA Adequate Intake of TOTAL water — drinks and the water in food — in
* litres per day (EFSA 2010; Summary of Dietary Reference Values, Table 3):
* 4–8 y 1.6 · 9–13 y 2.1 M / 1.9 F · 14 y and over 2.5 M / 2.0 F.
*/
function totalWaterAI(profile) {
	const age = Number(profile.age);
	const male = profile.sex === "m";
	if (age >= 14) return male ? 2.5 : 2;
	if (age >= 9) return male ? 2.1 : 1.9;
	if (age >= 4) return 1.6;
	return age >= 2 ? 1.3 : 1;
}
/** Share of total water that is assumed to be drunk (the rest arrives in food). A planning rule of thumb. */
var DRINKS_SHARE = .8;
/**
* Daily drinks target. It starts from the EFSA total-water AI for the member's
* age and sex — not a body-weight formula — takes the drinks share of it, and
* for athletes adds a training top-up for sweat losses.
*/
function hydrationTarget(profile, trainingLoad = "normal") {
	const add = {
		rest: 0,
		light: 250,
		normal: 500,
		hard: 750,
		game: 900,
		tournament: 1200
	}[trainingLoad] || 0;
	const drinksMl = totalWaterAI(profile) * 1e3 * DRINKS_SHARE + (profile.athlete ? add : 0);
	const ml = Math.round(drinksMl / 50) * 50;
	return {
		ml,
		glasses: Math.round(ml / 250),
		totalWaterL: totalWaterAI(profile),
		note: "Αρχική εκτίμηση από την τιμή αναφοράς της EFSA. Ζέστη, εφίδρωση, ασθένεια, φάρμακα και παθήσεις αλλάζουν σημαντικά την ανάγκη."
	};
}
function referenceValues(profile) {
	const age = Number(profile.age);
	const female = profile.sex !== "m";
	const fibre = age >= 18 ? 25 : age >= 15 ? 21 : age >= 11 ? 19 : age >= 7 ? 16 : age >= 4 ? 14 : 10;
	const calcium = age >= 25 ? 950 : age >= 18 ? 1e3 : age >= 11 ? 1150 : age >= 4 ? 800 : 450;
	let iron;
	if (age >= 18) if (!female) iron = {
		min: 11,
		max: 11
	};
	else if (age >= 55) iron = {
		min: 11,
		max: 11
	};
	else if (age >= 45) iron = {
		min: 11,
		max: 16
	};
	else iron = {
		min: 16,
		max: 16
	};
	else if (age >= 12) iron = female ? {
		min: 13,
		max: 13
	} : {
		min: 11,
		max: 11
	};
	else iron = {
		min: age >= 7 ? 11 : 7,
		max: age >= 7 ? 11 : 7
	};
	const sodiumMax = 2e3;
	return {
		fibre: { g: fibre },
		calcium: { mg: calcium },
		iron: {
			...iron,
			mg: iron.max
		},
		sodium: {
			maxMg: sodiumMax,
			saltG: round(sodiumMax * 2.5 / 1e3, 1)
		}
	};
}
/** Salt (g) from sodium (mg): salt = sodium × 2.5. */
var saltGrams = (sodiumMg) => round(Number(sodiumMg) * 2.5 / 1e3, 1);
/**
* Plain-language nutrition badges for a recipe, from its own per-serving totals.
* Protein and iron follow the EU claim thresholds (Regulation (EC) 1924/2006):
* "high protein" = at least 20 % of energy from protein; "high in" a mineral = at
* least twice the 15 % "source of" level, i.e. 30 % of the EU reference value
* (Regulation 1169/2011: iron 14 mg) — applied here per serving rather than per
* 100 g, since a serving is what a person eats. Fibre and calcium use stricter
* cut-offs than the legal ones so a badge stays a distinction: at the legal level
* most dishes here would carry them and they would say nothing. Salt is the one
* badge that is a caution rather than a compliment.
*/
function nutritionBadges(recipe) {
	const { p } = recipe.base;
	const kcal = kcalFromMacros(recipe.base);
	const m = recipe.micro || {};
	const out = [];
	if (kcal > 0 && p * 4 / kcal >= .2) out.push({
		id: "protein",
		label: "Υψηλή πρωτεΐνη",
		tone: "blue"
	});
	if (m.fib >= 10) out.push({
		id: "fibre",
		label: "Πλούσιο σε ίνες",
		tone: "accent"
	});
	if (m.fe >= 4.2) out.push({
		id: "iron",
		label: "Πλούσιο σε σίδηρο",
		tone: "rose"
	});
	if (m.ca >= 350) out.push({
		id: "calcium",
		label: "Πλούσιο σε ασβέστιο",
		tone: "gold"
	});
	if (m.na >= 900) out.push({
		id: "salt",
		label: "Αλμυρό",
		tone: "warn"
	});
	return out;
}
function portionProfile(profile, trainingLoad = "normal") {
	if (isMinor(profile) && profile.athlete) return {
		vegetables: 1,
		protein: 1.2,
		carbs: {
			rest: 1,
			light: 1.15,
			normal: 1.35,
			hard: 1.6,
			game: 1.75,
			tournament: 1.9
		}[trainingLoad] || 1.35,
		fats: 1,
		label: "Καύσιμο αθλητή"
	};
	if (isMinor(profile)) return {
		vegetables: 1,
		protein: 1,
		carbs: 1,
		fats: 1,
		label: "Ανάπτυξη & θρέψη"
	};
	if (profile.goal === "gradual_fat_loss") return {
		vegetables: 1.35,
		protein: 1,
		carbs: .75,
		fats: .8,
		label: "Ηπιότερο πιάτο"
	};
	return {
		vegetables: 1,
		protein: 1,
		carbs: 1,
		fats: 1,
		label: "Ισορροπημένη συντήρηση"
	};
}
function contextualGuidance({ profile, trainingLoad = "normal", today = {}, plannedMeal = null }) {
	const tips = [];
	const minor = isMinor(profile);
	if (minor) tips.push("Δεν χρησιμοποιείται περιορισμός θερμίδων ή κατηγορία BMI ενηλίκων σε αυτό το προφίλ.");
	if (profile.athlete) {
		if ([
			"hard",
			"game",
			"tournament"
		].includes(trainingLoad)) tips.push("Δώσε προτεραιότητα στους υδατάνθρακες πριν και μετά την προπόνηση, μαζί με ένα κανονικό γεύμα με πρωτεΐνη.");
		if (today.sleepHours != null && Number(today.sleepHours) < 8) tips.push("Σήμα αποκατάστασης: ο ύπνος που καταγράφηκε είναι κάτω από 8 ώρες σε προφίλ υψηλών απαιτήσεων.");
		if (today.waterMl != null && Number(today.waterMl) < hydrationTarget(profile, trainingLoad).ml * .55) tips.push("Η ενυδάτωση που καταγράφηκε είναι πίσω από την αρχική εκτίμηση της ημέρας.");
	}
	if (!minor && profile.goal === "gradual_fat_loss") tips.push("Χρησιμοποίησε την τάση 3–4 εβδομάδων, όχι μία ημέρα, πριν μειώσεις περαιτέρω τις μερίδες.");
	if (plannedMeal) tips.push(`Επόμενο προγραμματισμένο γεύμα: ${plannedMeal.name}.`);
	return tips.slice(0, 3);
}
var NUTRIENT_KEYS = [
	"p",
	"c",
	"f",
	"fib",
	"na",
	"fe",
	"ca"
];
/** The multiplier a member's portion profile applies to one food. */
function foodFactor(food, pp) {
	let k = 0;
	for (const [role, weight] of Object.entries(roleWeights(food))) k += weight * (pp[role] ?? 1);
	return k;
}
/**
* A recipe's ingredient lines at this member's scale: `[{ ing, food, g }]`.
*
* Three independent multipliers, in the order a cook thinks about them:
*   1. the portion PROFILE — what the plate is made of (a lighter carbohydrate
*      helping, more vegetables…), from `portionProfile`;
*   2. the PLATE size `profile.plate` — how big the whole plate is, calibrated to
*      the member's estimated energy need (see `plateScale`); 1 when absent;
*   3. the logged `portion` — "a bit less / a bit more today".
*/
function scaledIngredients(recipe, profile, trainingLoad = "normal", portion = 1) {
	const pp = portionProfile(profile, trainingLoad);
	const plate = Number.isFinite(profile?.plate) && profile.plate > 0 ? profile.plate : 1;
	const mult = (Number(portion) || 1) * plate;
	return recipe.ingredients.map((ing) => {
		const food = FOODS[ing.f];
		return {
			ing,
			food,
			g: ing.g * foodFactor(food, pp) * mult
		};
	});
}
var PLATE_MAX = 1.5;
/** Mean planned energy of the rotation for one profile at plate size 1. */
function rotationEnergy(profile, trainingLoad, plan, recipeById) {
	const bare = {
		...profile,
		plate: 1
	};
	let total = 0;
	for (const day of plan) total += dayMacros(day, bare, trainingLoad, {}, recipeById).planned.kcal;
	return plan.length ? total / plan.length : 0;
}
function plateScale(profile, planKcal, trainingLoad = "normal") {
	if (!isMinor(profile) && profile.goal === "gradual_fat_loss") return 1;
	if (!(planKcal > 0)) return 1;
	const { lower, upper } = energyRange(profile, trainingLoad);
	const raw = (lower + upper) / 2 / planKcal;
	return Math.min(PLATE_MAX, Math.max(1, Math.round(raw * 20) / 20));
}
/** Sum of nutrients over scaled lines, unrounded. */
function sumLines(lines) {
	const acc = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0]));
	for (const { ing, g } of lines) {
		const n = nutrientsIn(ing.f, g);
		for (const k of NUTRIENT_KEYS) acc[k] += n[k];
	}
	return acc;
}
/** Round raw sums into the shape the app displays. Energy comes from the ROUNDED macros. */
function finishNutrition(acc) {
	const p = round(acc.p, 1), c = round(acc.c, 1), f = round(acc.f, 1), fib = round(acc.fib, 1);
	return {
		p,
		c,
		f,
		fib,
		kcal: kcalFromMacros({
			p,
			c,
			f,
			fib
		}),
		na: Math.round(acc.na),
		fe: round(acc.fe, 1),
		ca: Math.round(acc.ca)
	};
}
function mealMacros(recipe, profile, trainingLoad = "normal", portion = 1) {
	return finishNutrition(sumLines(scaledIngredients(recipe, profile, trainingLoad, portion)));
}
/**
* Totals for one day, split into what was CONFIRMED by the user and what is
* merely PLANNED. v2 blurred the two; keeping them separate is what makes the
* numbers trustworthy.
*/
function dayMacros(planDay, profile, trainingLoad = "normal", log = {}, recipeById = () => null) {
	const empty = () => Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0]));
	const add = (acc, m) => {
		for (const k of NUTRIENT_KEYS) acc[k] += m[k] ?? 0;
	};
	const planned = empty();
	const confirmed = empty();
	const slots = [
		"breakfast",
		"lunch",
		"snack",
		"dinner"
	];
	const confirmedSlots = [];
	const detail = [];
	for (const slot of slots) {
		const id = planDay?.[slot];
		const r = id ? recipeById(id) : null;
		if (!r) continue;
		const plannedMacros = mealMacros(r, profile, trainingLoad, 1);
		add(planned, plannedMacros);
		const entry = log?.meals?.[slot];
		const done = entry?.status === "done";
		const eaten = done && entry?.recipeId ? recipeById(entry.recipeId) || r : r;
		if (done) {
			add(confirmed, mealMacros(eaten, profile, trainingLoad, entry.portion ?? 1));
			confirmedSlots.push(slot);
		}
		detail.push({
			slot,
			recipe: r,
			eaten,
			planned: plannedMacros,
			logged: done,
			swapped: !!(done && entry?.recipeId && eaten?.id !== r?.id),
			portion: entry?.portion ?? null,
			skipped: entry?.status === "skipped"
		});
	}
	const finish = finishNutrition;
	const extras = [];
	for (const ex of Array.isArray(log?.extras) ? log.extras : []) {
		const r = recipeById(ex?.recipeId);
		if (!r) continue;
		const m = mealMacros(r, profile, trainingLoad, ex.portion ?? 1);
		add(confirmed, m);
		extras.push({
			id: ex.id,
			recipe: r,
			portion: ex.portion ?? 1,
			macros: m
		});
	}
	return {
		planned: finish(planned),
		confirmed: finish(confirmed),
		confirmedSlots,
		detail,
		extras
	};
}
/** Everything a view needs about one member's targets, in one call. */
function targetsFor(profile, trainingLoad = "normal") {
	return {
		energy: energyRange(profile, trainingLoad),
		protein: proteinRange(profile),
		hydration: hydrationTarget(profile, trainingLoad),
		portions: portionProfile(profile, trainingLoad)
	};
}
function weightTrend(measurements) {
	const points = [...measurements || []].filter((m) => Number.isFinite(Number(m.weight))).sort((a, b) => String(a.date).localeCompare(String(b.date))).map((m) => ({
		date: m.date,
		weight: Number(m.weight)
	}));
	if (points.length === 0) return {
		points,
		count: 0,
		slopePerWeek: null,
		change: null,
		first: null,
		last: null,
		spanDays: 0,
		direction: "none"
	};
	const d0 = dayNumber(points[0].date);
	const xs = points.map((p) => dayNumber(p.date) - d0);
	const ys = points.map((p) => p.weight);
	const first = points[0].weight;
	const last = points[points.length - 1].weight;
	const spanDays = xs[xs.length - 1];
	let slopePerWeek = null;
	if (points.length >= 2 && spanDays > 0) {
		const n = xs.length;
		const mx = xs.reduce((a, b) => a + b, 0) / n;
		const my = ys.reduce((a, b) => a + b, 0) / n;
		let num = 0, den = 0;
		for (let i = 0; i < n; i++) {
			num += (xs[i] - mx) * (ys[i] - my);
			den += (xs[i] - mx) ** 2;
		}
		if (den > 0) slopePerWeek = round(num / den * 7, 2);
	}
	const change = round(last - first, 1);
	const direction = change > .3 ? "up" : change < -.3 ? "down" : "flat";
	return {
		points,
		count: points.length,
		slopePerWeek,
		change,
		first,
		last,
		spanDays,
		direction
	};
}
function buildShoppingList({ days, profiles, recipeById, loadFor = () => "normal" }) {
	const need = /* @__PURE__ */ new Map();
	for (const day of Array.isArray(days) ? days : []) for (const slot of MEAL_ORDER) {
		const recipe = recipeById(day?.plan?.[slot]);
		if (!recipe) continue;
		const perMember = (Array.isArray(profiles) ? profiles : []).map((p) => scaledIngredients(recipe, p, loadFor(p), 1));
		recipe.ingredients.forEach((ing, i) => {
			const grams = perMember.reduce((sum, lines) => sum + lines[i].g, 0);
			const cur = need.get(ing.f) || {
				grams: 0,
				meals: 0
			};
			cur.grams += grams;
			cur.meals += 1;
			need.set(ing.f, cur);
		});
	}
	return [...need.entries()].map(([id, { grams, meals }]) => {
		const food = FOODS[id];
		const { unit, step } = food.shop;
		const raw = unit === "ml" ? grams / (food.density ?? 1) : unit === "τεμ" ? grams / food.pieceG : grams;
		const qty = Math.max(step, Math.ceil(raw / step - 1e-9) * step);
		return {
			id,
			key: id,
			name: food.plural,
			aisle: food.aisle,
			unit,
			qty,
			exact: raw,
			meals
		};
	}).sort((a, b) => a.name.localeCompare(b.name, "el"));
}
var MEAL_ORDER = [
	"breakfast",
	"lunch",
	"snack",
	"dinner"
];
//#endregion
//#region src/lib/persistence.ts
var profileSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	relation: z.string(),
	role: z.string(),
	sex: z.enum(["m", "f"]),
	age: z.number().positive(),
	height: z.number().positive(),
	weight: z.number().positive(),
	activityFactor: z.number().positive(),
	goal: z.string(),
	athlete: z.boolean(),
	accent: z.string(),
	notes: z.string(),
	plate: z.number().optional()
});
var daySchema = z.object({
	meals: z.record(z.object({
		status: z.enum(["done", "skipped"]),
		portion: z.number().positive()
	})),
	waterMl: z.number().nonnegative()
});
var stateSchema = z.object({
	language: z.enum(["el", "en"]).optional(),
	profiles: z.array(profileSchema).nonempty(),
	activeId: z.string(),
	loads: z.record(z.string()).default({}),
	logs: z.record(z.record(daySchema)).default({}),
	measurements: z.record(z.array(z.object({
		date: z.string(),
		weight: z.number().positive()
	}))).default({}),
	shopChecked: z.record(z.boolean()).default({}),
	trainingSettings: z.record(z.record(z.unknown())).default({}),
	trainingLogs: z.record(z.record(z.unknown())).default({})
});
function parseSavedState(input) {
	const parsed = stateSchema.parse(input);
	if (new Set(parsed.profiles.map((p) => p.id)).size !== parsed.profiles.length) throw new Error("Duplicate member IDs");
	if (!parsed.profiles.some((p) => p.id === parsed.activeId)) throw new Error("Unknown active member");
	const { language, profiles, ...rest } = parsed;
	return {
		...rest,
		...language ? { language } : {},
		profiles: profiles.map((p) => {
			const { plate, ...profile } = p;
			return {
				...profile,
				...plate === void 0 ? {} : { plate }
			};
		})
	};
}
var database;
function getDatabase() {
	if (!database) {
		database = new Dexie("zenith-family-v1");
		database.version(1).stores({ family: "id" });
	}
	return database;
}
async function readDurableState() {
	const row = await getDatabase().family.get("household");
	return row ? {
		...row,
		state: parseSavedState(row.state)
	} : null;
}
async function writeDurableState(state, savedAt) {
	await getDatabase().family.put({
		id: "household",
		state: structuredClone(state),
		savedAt
	});
}
/** Merge only the leaf values changed by this action, preserving another tab's unrelated edits. */
function mergeChangedState(before, after, latest) {
	function merge(a, b, c) {
		if (JSON.stringify(a) === JSON.stringify(b)) return c;
		if (Array.isArray(a) && Array.isArray(b) && Array.isArray(c) && b.every((x) => x && typeof x === "object" && "id" in x)) return b.map((item) => merge(a.find((x) => x.id === item.id), item, c.find((x) => x.id === item.id) ?? item));
		if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
			const aa = a, bb = b;
			const result = { ...c && typeof c === "object" ? c : {} };
			for (const key of /* @__PURE__ */ new Set([...Object.keys(aa), ...Object.keys(bb)])) if (!(key in bb)) delete result[key];
			else result[key] = merge(aa[key], bb[key], result[key]);
			return result;
		}
		return b;
	}
	return merge(before, after, latest);
}
//#endregion
//#region src/lib/store.ts
var KEY = "fnos-state-v1";
var recipeMap = new Map(RECIPES.map((r) => [r.id, r]));
var recipeById = (id) => recipeMap.get(id) ?? null;
var planFor = (dateKey) => PLAN_28[cycleDayIndex(dateKey) - 1];
var todayKey = () => localDateKey(/* @__PURE__ */ new Date());
/** Same calibration the original app applies: scale the plate so the rotation lands mid-range. */
function withPlate(p, load = "normal") {
	const kcal = rotationEnergy(p, load, PLAN_28, recipeById);
	return {
		...p,
		plate: plateScale(p, kcal, load)
	};
}
var initial = () => ({
	language: "el",
	profiles: FAMILY.map((p) => ({ ...p })),
	activeId: FAMILY[0].id,
	loads: { son: "normal" },
	logs: {},
	measurements: {},
	shopChecked: {},
	trainingSettings: {},
	trainingLogs: {}
});
var state = initial();
var hydrated = false;
var listeners = /* @__PURE__ */ new Set();
var saveStatus = "loading";
var revision = 0;
var writeQueue = Promise.resolve();
var statusListeners = /* @__PURE__ */ new Set();
function status(value) {
	saveStatus = value;
	statusListeners.forEach((l) => l());
}
function notify() {
	listeners.forEach((l) => l());
}
function localSaved() {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? parseSavedState(JSON.parse(raw)) : null;
	} catch {
		return null;
	}
}
function persist() {
	const snapshot = structuredClone(state);
	const stamp = Date.now();
	revision += 1;
	const writingRevision = revision;
	status("saving");
	let localOk = false;
	try {
		localStorage.setItem(KEY, JSON.stringify(snapshot));
		localStorage.setItem(`${KEY}-saved-at`, String(stamp));
		localOk = true;
	} catch {}
	writeQueue = writeQueue.then(async () => {
		try {
			await writeDurableState(snapshot, stamp);
			if (revision === writingRevision) status("saved");
		} catch {
			if (revision === writingRevision) status(localOk ? "fallback" : "error");
		}
	});
}
function load() {
	if (hydrated || typeof window === "undefined") return;
	hydrated = true;
	const local = localSaved();
	if (local) state = local;
	const startingRevision = revision;
	let stamp = 0;
	try {
		stamp = Number(localStorage.getItem(`${KEY}-saved-at`)) || 0;
	} catch {}
	readDurableState().then((row) => {
		if (revision !== startingRevision) return;
		if (row && (!local || row.savedAt > stamp)) {
			state = row.state;
			notify();
		}
		persist();
	}).catch(() => {
		if (revision === startingRevision) status(local ? "fallback" : "error");
	});
	window.addEventListener("storage", (event) => {
		if (event.key !== KEY || !event.newValue) return;
		try {
			state = parseSavedState(JSON.parse(event.newValue));
			revision += 1;
			notify();
			status("saved");
		} catch {}
	});
	navigator.storage?.persist?.().catch(() => false);
}
function setState(fn) {
	load();
	const next = fn(state);
	const latest = typeof window === "undefined" ? null : localSaved();
	state = latest ? mergeChangedState(state, next, latest) : next;
	persist();
	notify();
}
/** Restore is explicitly replacement, not a partial edit. */
function restoreState(input) {
	load();
	state = parseSavedState(input);
	persist();
	notify();
}
function useSaveStatus() {
	return useSyncExternalStore((cb) => {
		statusListeners.add(cb);
		return () => statusListeners.delete(cb);
	}, () => saveStatus, () => "loading");
}
var serverState = initial();
function useStore(sel) {
	return useSyncExternalStore((cb) => {
		load();
		listeners.add(cb);
		cb();
		return () => listeners.delete(cb);
	}, () => sel(state), () => sel(serverState));
}
var EMPTY_LOG = Object.freeze({
	meals: {},
	waterMl: 0
});
function getLog(s, id, date) {
	return s.logs[id]?.[date] ?? EMPTY_LOG;
}
function updateLog(id, date, fn) {
	setState((s) => ({
		...s,
		logs: {
			...s.logs,
			[id]: {
				...s.logs[id] ?? {},
				[date]: fn(getLog(s, id, date))
			}
		}
	}));
}
var loadOf = (s, id) => s.loads[id] ?? "normal";
//#endregion
//#region src/lib/i18n.ts
var dictionary = {
	Σήμερα: "Today",
	Πλάνο: "Plan",
	Γεύματα: "Meals",
	Αγορές: "Shopping",
	Πρόοδος: "Progress",
	Οικογένεια: "Family",
	Γνώση: "Guide",
	Περισσότερα: "More",
	Άλλα: "More",
	"Γρήγορη αναζήτηση": "Quick search",
	"Οικογένεια & προφίλ": "Family & profiles",
	"Μεθοδολογία & πηγές": "Method & sources",
	"Φωτεινό θέμα": "Light theme",
	"Σκούρο θέμα": "Dark theme",
	"Θέμα: ακολούθησε τη συσκευή": "Theme: follow device",
	Εκτύπωση: "Print",
	"Export δεδομένων": "Export data",
	"Import δεδομένων": "Import data",
	Καλημέρα: "Good morning",
	Καλησπέρα: "Good evening",
	"Καλό βράδυ": "Good evening",
	Πρωινό: "Breakfast",
	Μεσημεριανό: "Lunch",
	Σνακ: "Snack",
	Βραδινό: "Dinner",
	"Το έφαγα": "I ate it",
	Μαγείρεμα: "Cook mode",
	Συνταγή: "Recipe",
	"Γρήγορη εναλλακτική": "Quick alternative",
	"Το έφαγε η οικογένεια": "Family ate this",
	"Οικογένεια τώρα": "Family now",
	Προφίλ: "Profiles",
	Νερό: "Water",
	Ενέργεια: "Energy",
	Πρωτεΐνη: "Protein",
	Υγρά: "Fluids",
	Ίνες: "Fibre",
	Αλάτι: "Salt",
	"Σήμερα στο πιάτο": "Today on your plate",
	"Επόμενο γεύμα": "Next meal",
	"Ημέρα ολοκληρωμένη": "Day complete",
	"Πλάνο ημέρας": "Day plan",
	"Σημερινά γεύματα": "Today’s meals",
	"Λεπτομέρειες ημέρας": "Day details",
	Λεπτομέρειες: "Details",
	Παράλειψη: "Skip",
	Καταγράφηκε: "Logged",
	Αναίρεση: "Undo",
	"Βιβλιοθήκη συνταγών": "Recipe library",
	"Αναζήτηση συνταγής ή υλικού…": "Search recipe or ingredient…",
	Ταξινόμηση: "Sort",
	"Τυπική σειρά": "Default order",
	"Πιο γρήγορα": "Fastest",
	"Λιγότερες kcal": "Lowest kcal",
	Αλφαβητικά: "Alphabetical",
	"Όλα τα γεύματα": "All meals",
	Όλα: "All",
	Γρήγορα: "Fast",
	"Μαζικό μαγείρεμα": "Batch cooking",
	Όσπρια: "Legumes",
	Ψάρι: "Fish",
	Λαχανικά: "Vegetables",
	"Υψηλή πρωτεΐνη": "High protein",
	"Πλούσιο σε σίδηρο": "High iron",
	"Πλούσιο σε ίνες": "High fibre",
	Αθλητής: "Athlete",
	"Καμία συνταγή δεν ταιριάζει": "No recipes match",
	"Δοκίμασε άλλη λέξη ή καθάρισε τα φίλτρα.": "Try another search or clear the filters.",
	"Καθαρισμός φίλτρων": "Clear filters",
	"Υλικά για όλη την οικογένεια": "Ingredients for the whole family",
	"Πόσο για τον καθένα": "Amount for each person",
	Βήματα: "Steps",
	Συμβουλή: "Tip",
	Θρεπτικά: "Nutrition",
	Αναφορές: "References",
	"Λίστα αγορών": "Shopping list",
	"Ό,τι απομένει": "Remaining",
	Αγορασμένα: "Bought",
	Καθαρισμός: "Clear",
	Αντιγραφή: "Copy",
	Οπωροπωλείο: "Produce",
	"Κρέας & ψάρι": "Meat & fish",
	"Γαλακτοκομικά & αυγά": "Dairy & eggs",
	Παντοπωλείο: "Pantry",
	Κατεψυγμένα: "Frozen",
	Καταγραφή: "Logging",
	Μετρήσεις: "Measurements",
	Τάση: "Trend",
	Συνέπεια: "Consistency",
	"Νέα μέτρηση": "New measurement",
	Βάρος: "Weight",
	Αποθήκευση: "Save",
	Άκυρο: "Cancel",
	Διαγραφή: "Delete",
	Επεξεργασία: "Edit",
	"Νέο μέλος": "New member",
	Δημιουργία: "Create",
	Στόχος: "Goal",
	Ηλικία: "Age",
	Ύψος: "Height",
	Δραστηριότητα: "Activity",
	Συντήρηση: "Maintain",
	Ανάπτυξη: "Growth",
	Απόδοση: "Performance",
	"Σταδιακή απώλεια λίπους (μόνο ενήλικες)": "Gradual fat loss (adults only)",
	Μεθοδολογία: "Method",
	Πηγές: "Sources",
	Ασφάλεια: "Safety",
	Γλωσσάρι: "Glossary",
	Ιδιωτικότητα: "Privacy",
	"Τοπικά δεδομένα": "Local data",
	"Μόνιμη αποθήκευση": "Persistent storage",
	"Διαγραφή όλων των δεδομένων": "Delete all data",
	Κλείσιμο: "Close",
	Πίσω: "Back",
	Επόμενο: "Next",
	Προηγούμενο: "Previous",
	"Αυτή η εβδομάδα": "This week",
	Επιστροφή: "Back to current",
	Προετοιμασία: "Preparation",
	Έλεγχος: "Check",
	Προσαρμοσμένο: "Customized",
	"Όλη η οικογένεια": "Whole family",
	Εβδομάδα: "Week",
	"4 εβδομάδες": "4 weeks",
	Αλλαγή: "Change",
	"Επαναφορά ημέρας": "Reset day",
	"Αντιγραφή οικογενειακής εβδομάδας στο μέλος": "Copy family week to this member",
	"Γιαούρτι, βρώμη & φρούτο": "Yogurt, oats & fruit",
	"Αυγά, ψωμί ολικής & ντομάτα": "Eggs, wholegrain bread & tomato",
	"Χυλός βρώμης με μήλο & καρύδια": "Oat porridge with apple & walnuts",
	"Αυγά με σπανάκι & φέτα": "Eggs with spinach & feta",
	"Τοστ ολικής με φέτα, ντομάτα & αγγούρι": "Wholegrain toast with feta, tomato & cucumber",
	"Φακές, σαλάτα & φέτα": "Lentils, salad & feta",
	"Κοτόπουλο λεμονάτο, πατάτα & σαλάτα": "Lemon chicken, potatoes & salad",
	"Κοτόπουλο με ρύζι & λαχανικά": "Chicken with rice & vegetables",
	"Ψάρι, ρύζι & χόρτα": "Fish, rice & greens",
	"Γίγαντες & χωριάτικη": "Giant beans & Greek salad",
	"Ρεβίθια λεμονάτα στο φούρνο": "Lemon chickpeas baked in the oven",
	Φασολάδα: "Bean soup",
	"Γεμιστά με ρύζι & μυρωδικά": "Stuffed vegetables with rice & herbs",
	"Μπιφτέκια φούρνου με πατάτες": "Baked meatballs with potatoes",
	"Γιαούρτι & φρούτο": "Yogurt & fruit",
	"Μπανάνα & ψωμί με ταχίνι": "Banana & bread with tahini",
	"Αποκατάσταση: γάλα, μπανάνα & βρώμη": "Recovery: milk, banana & oats",
	"Χωριάτικη σαλάτα με ψωμί": "Greek salad with bread",
	Φρουτοσαλάτα: "Fruit salad",
	"Smoothie γιαουρτιού, φρούτου & βρώμης": "Yogurt, fruit & oat smoothie",
	"Γιαούρτι με μέλι, καρύδια & φρούτο": "Yogurt with honey, walnuts & fruit",
	"Ομελέτα λαχανικών": "Vegetable omelette",
	"Ντάκος ολικής": "Wholegrain dakos",
	"Ζυμαρικά ολικής, ντομάτα & λαχανικά": "Wholegrain pasta, tomato & vegetables",
	"Σουβλάκι κοτόπουλο με πίτα ολικής": "Chicken souvlaki with wholegrain pita",
	"Ψάρι πλακί με λαχανικά": "Baked fish with vegetables",
	"Σπανακόρυζο με φέτα": "Spinach rice with feta",
	"Τραχανάς με φέτα": "Trahana with feta",
	"Υπάρχει νέα έκδοση της εφαρμογής.": "A new app version is available.",
	"Ανανέωση τώρα": "Update now",
	"Τα σημερινά γεύματα": "Today’s meals",
	καταγράφηκαν: "are logged",
	"Δεν υπάρχει άλλο γεύμα για σήμερα. Κράτα την ενυδάτωση ενημερωμένη και δες το αυριανό πλάνο.": "There are no more meals today. Keep hydration updated and check tomorrow’s plan.",
	"Δες το πλάνο": "View plan",
	"Η ημέρα με μια ματιά": "Day at a glance",
	"Καταγεγραμμένη ενέργεια": "Logged energy",
	Ενυδάτωση: "Hydration",
	"Ολοκληρώθηκαν όλα": "All completed",
	"Το πλάνο της ημέρας": "Today’s plan",
	"Τα τέσσερα γεύματα": "Four meals",
	ολοκληρώθηκαν: "completed",
	"Πρόσθετα σήμερα": "Extras today",
	Αφαίρεση: "Remove",
	"Θρεπτικά της ημέρας": "Daily nutrition",
	"Τι δίνει το σημερινό πλάνο": "What today’s plan provides",
	"Φυτικές ίνες": "Fibre",
	Σίδηρος: "Iron",
	Ασβέστιο: "Calcium",
	"Αλάτι από τα τρόφιμα": "Salt from food",
	Καταγεγραμμένα: "Logged",
	Υδατάνθρακες: "Carbohydrates",
	Λιπαρά: "Fat",
	"Γιατί αυτό σήμερα": "Why this today",
	"Στο πιάτο σου:": "On your plate:",
	Μηδέν: "Zero",
	"1 ποτήρι = 250 ml": "1 glass = 250 ml",
	"Ώρα για φαγητό": "Time to eat",
	Εκκρεμεί: "Overdue",
	"Γρήγορες ενέργειες γεύματος": "Quick meal actions",
	"Η μέρα είναι τακτοποιημένη": "The day is on track",
	γεύματα: "meals",
	νερό: "water",
	"Πάτησε ένα πρόσωπο για να δεις αμέσως το δικό του πλάνο και τη δική του μερίδα.": "Tap a person to instantly see their plan and portion.",
	Μικρότερη: "Smaller",
	"Όπως το πλάνο": "As planned",
	Μεγαλύτερη: "Larger",
	Παραλείφθηκε: "Skipped",
	"Άλλη μερίδα": "Different portion",
	Έγινε: "Done",
	"Καλώς ήρθες": "Welcome",
	"Τρία βήματα και είσαι έτοιμος": "Three steps and you’re ready",
	Απόκρυψη: "Dismiss",
	"Διάλεξε ποιος είσαι": "Choose who you are",
	"Πάτησε «Το έφαγα»": "Tap “I ate it”",
	"Δες τη Λίστα αγορών": "Open the Shopping list",
	"Λίγο ακόμα για σήμερα": "A little more for today",
	"Μέγεθος πιάτου": "Plate size",
	"Κέντρο οικογένειας": "Family command center",
	"Όλοι είναι τακτοποιημένοι σήμερα": "Everyone is on track today",
	"Όλη η διατροφή της οικογένειας, από ένα σημείο": "The whole family’s nutrition, from one place",
	μέλη: "members",
	"με επόμενο γεύμα": "with a next meal",
	"ολοκλήρωσαν τη μέρα": "completed the day",
	"Γεύματα σήμερα": "Meals today",
	"Μέση ενυδάτωση": "Average hydration",
	"Εβδομαδιαίο πλάνο": "Weekly plan",
	"Συνταγές & γεύματα": "Recipes & meals",
	"Μέλη οικογένειας": "Family members",
	"Γνώση & πηγές": "Guide & sources",
	"Γρήγορες ενέργειες οικογένειας": "Family quick actions",
	"Σύνοψη οικογένειας": "Family summary",
	"Η οικογένεια σήμερα, χωρίς ψάξιμο": "Your family today, without hunting around",
	"Τώρα για": "Now for",
	"Καταγραφή οικογένειας": "Log for family",
	"Η σημερινή μέρα ολοκληρώθηκε": "Today is complete",
	"Δες τι ακολουθεί αύριο": "See what comes tomorrow",
	"Άνοιξε το οικογενειακό πλάνο": "Open the family plan",
	"Έτοιμη λίστα": "List ready",
	επιλογές: "options",
	προφίλ: "profiles",
	"Τάσεις & συνέπεια": "Trends & consistency",
	Ολοκλήρωσαν: "Completed",
	Μητέρα: "Mother",
	Πατέρας: "Father",
	Κόρη: "Daughter",
	Γιος: "Son",
	"Υγεία & σταδιακή απώλεια λίπους": "Health & gradual fat loss",
	"Συντήρηση & καρδιομεταβολική υγεία": "Maintenance & cardiometabolic health",
	"Ανάπτυξη & ενέργεια": "Growth & energy",
	"Basketball · απόδοση & αποκατάσταση": "Basketball · performance & recovery",
	"Γιαούρτι στραγγιστό 2%": "Greek yogurt 2%",
	Φέτα: "Feta",
	"Τυρί τριμμένο (κεφαλοτύρι)": "Grated hard cheese (kefalotyri)",
	"Γάλα ημιαποβουτυρωμένο": "Semi-skimmed milk",
	Αυγό: "Egg",
	Αυγά: "Eggs",
	"Στήθος κοτόπουλου": "Chicken breast",
	"Κιμάς μοσχαρίσιος": "Lean ground beef",
	"Φιλέτο ψαριού (τσιπούρα/λαβράκι)": "Fish fillet (sea bream/sea bass)",
	"Φακές ξηρές": "Dry lentils",
	"Γίγαντες ξηροί": "Dry giant beans",
	"Φασόλια ξηρά": "Dry beans",
	"Ρεβίθια ξηρά": "Dry chickpeas",
	Βρώμη: "Oats",
	Ρύζι: "Rice",
	"Ζυμαρικά ολικής": "Wholegrain pasta",
	Τραχανάς: "Trahana",
	"Παξιμάδι κριθαρένιο": "Barley rusk",
	"Παξιμάδια κριθαρένια": "Barley rusks",
	"Ψωμί ολικής": "Wholegrain bread",
	"Πίτα ολικής": "Wholegrain pita",
	"Πίτες ολικής": "Wholegrain pitas",
	Ελαιόλαδο: "Olive oil",
	Καρύδια: "Walnuts",
	Ταχίνι: "Tahini",
	Ελιές: "Olives",
	Μέλι: "Honey",
	"Ντομάτα κονκασέ (κονσέρβα)": "Crushed canned tomato",
	Μπανάνα: "Banana",
	Μπανάνες: "Bananas",
	"Φρούτα εποχής": "Seasonal fruit",
	Ντομάτα: "Tomato",
	Ντομάτες: "Tomatoes",
	Αγγούρι: "Cucumber",
	Αγγούρια: "Cucumbers",
	Πιπεριά: "Pepper",
	Πιπεριές: "Peppers",
	Κολοκύθι: "Zucchini",
	Κολοκυθάκια: "Zucchini",
	Κρεμμύδι: "Onion",
	Κρεμμύδια: "Onions",
	Καρότο: "Carrot",
	Καρότα: "Carrots",
	Σέλινο: "Celery",
	Πατάτες: "Potatoes",
	Σπανάκι: "Spinach",
	Μανιτάρια: "Mushrooms",
	Μαρούλι: "Romaine lettuce",
	"Χόρτα εποχής": "Seasonal greens",
	"Μαϊντανός & δυόσμος": "Parsley & mint",
	Λεμόνι: "Lemon",
	Λεμόνια: "Lemons",
	"Βάλε τη βρώμη στο γιαούρτι και άστην 5′ να μαλακώσει.": "Stir the oats into the yogurt and leave for 5 min to soften.",
	"Κόψε το φρούτο από πάνω.": "Slice the fruit on top.",
	"Πρόσθεσε τους ξηρούς καρπούς τελευταία για να μείνουν τραγανιστοί.": "Add the nuts last so they stay crunchy.",
	"Ιδανικό πρωινό πριν από πρωινή προπόνηση: υδατάνθρακες + πρωτεΐνη σε ένα μπολ.": "Ideal before a morning training session: carbohydrate + protein in one bowl.",
	"Ψήσε τα αυγά στο ελαιόλαδο σε μέτρια φωτιά.": "Cook the eggs in olive oil over medium heat.",
	"Σέρβιρε με ψωμί ολικής και φρέσκια ντομάτα.": "Serve with wholegrain bread and fresh tomato.",
	"Οι ελιές μπαίνουν στο τέλος, χωρίς επιπλέον αλάτι.": "Add the olives at the end, with no extra salt.",
	"Πρόσθεσε ένα φρούτο εποχής στο πλάι.": "Add seasonal fruit on the side.",
	"Το αλάτι στις ελιές αρκεί — μη προσθέτεις επιπλέον στο πιάτο.": "The salt in the olives is enough — do not add extra to the plate.",
	"Βράσε τη βρώμη με το γάλα σε χαμηλή φωτιά ~6′, ανακατεύοντας.": "Simmer the oats with the milk over low heat for about 6 min, stirring.",
	"Πρόσθεσε το μήλο κομμένο σε κύβους και λίγη κανέλα.": "Add diced apple and a little cinnamon.",
	"Τα καρύδια μπαίνουν τελευταία, για να μείνουν τραγανά.": "Add the walnuts last so they stay crunchy.",
	"Ζεστό και χορταστικό για κρύα πρωινά — η βρώμη κρατά τον κορεσμό ώς το μεσημέρι.": "Warm and filling for cold mornings — oats help keep you satisfied until lunch.",
	"Σόταρε το σπανάκι στο ελαιόλαδο 2′ μέχρι να μαραθεί.": "Sauté the spinach in olive oil for 2 min until wilted.",
	"Πρόσθεσε τα χτυπημένα αυγά και ανακάτευε σε χαμηλή φωτιά ~3′.": "Add the beaten eggs and stir over low heat for about 3 min.",
	"Θρυμμάτισε τη φέτα από πάνω και σέρβιρε με ψωμί ολικής και ένα φρούτο εποχής.": "Crumble feta on top and serve with wholegrain bread and seasonal fruit.",
	"Η φέτα αλατίζει το πιάτο — δεν χρειάζεται επιπλέον αλάτι.": "Feta already seasons the dish — no extra salt is needed.",
	"Φρυγάνισε το ψωμί.": "Toast the bread.",
	"Στρώσε τη φέτα και πρόσθεσε φέτες ντομάτα και αγγούρι.": "Add the feta, then tomato and cucumber slices.",
	"Ελαιόλαδο και ρίγανη από πάνω, και ένα φρούτο εποχής στο πλάι.": "Finish with olive oil and oregano, with seasonal fruit on the side.",
	"Πρωινό χωρίς μαγείρεμα — ταιριάζει όταν βιάζεστε για το σχολείο.": "A no-cook breakfast for busy school mornings.",
	"Βράσε τις φακές με καρότο και κρεμμύδι ~25′.": "Simmer the lentils with carrot and onion for about 25 min.",
	"Άφησε να τραβήξουν και πρόσθεσε ελαιόλαδο εκτός φωτιάς.": "Let them absorb the liquid, then add olive oil off the heat.",
	"Σέρβιρε με ντομάτα, αγγούρι, φέτα και μία φέτα ψωμί.": "Serve with tomato, cucumber, feta and a slice of bread.",
	"Μαγείρεψε διπλή ποσότητα: κρατά 3 ημέρες στο ψυγείο και μπαίνει σε ταπεράκι.": "Cook a double batch: it keeps for 3 days in the fridge and packs well for lunch.",
	"Σε ταψί: κοτόπουλο, πατάτες, λεμόνι, ελαιόλαδο, ρίγανη.": "Place chicken, potatoes, lemon, olive oil and oregano in a roasting tray.",
	"Ψήσε 40′ στους 200°C.": "Bake for 40 min at 200°C.",
	"Σέρβιρε με φρέσκια σαλάτα στο πλάι.": "Serve with a fresh salad.",
	"Ένα ταψί = δύο γεύματα. Το δεύτερο κρυώνει και μπαίνει σε ταπεράκι για αύριο.": "One tray = two meals. Cool the second portion and pack it for tomorrow.",
	"Σε ταψί: ρύζι, πιπεριά, ντομάτα, κρεμμύδι, ελαιόλαδο και ζεστό νερό — το νερό να καλύπτει το ρύζι.": "In a tray combine rice, pepper, tomato, onion, olive oil and hot water; the water should cover the rice.",
	"Ακούμπησε από πάνω το κοτόπουλο και ψήσε 45′ στους 190°C.": "Place the chicken on top and bake for 45 min at 190°C.",
	"Άφησέ το 5′ να ξεκουραστεί πριν το σερβίρεις.": "Rest for 5 min before serving.",
	"Όλο το γεύμα σε ένα ταψί — λίγη δουλειά, λίγα πιάτα.": "The whole meal in one tray — less work and fewer dishes.",
	"Βράσε το ρύζι και τα χόρτα χωριστά.": "Cook the rice and greens separately.",
	"Ψήσε το ψάρι στο τηγάνι ή στο φούρνο ~12′.": "Cook the fish in a pan or oven for about 12 min.",
	"Λεμόνι και ελαιόλαδο από πάνω, όχι μέσα στο μαγείρεμα.": "Add lemon and olive oil after cooking.",
	"Στόχος: ψάρι 2 φορές την εβδομάδα, με ποικιλία ειδών.": "Aim for fish twice a week, using a variety of species.",
	"Μούλιασε τους γίγαντες από το προηγούμενο βράδυ.": "Soak the giant beans overnight.",
	"Ψήσε με ντομάτα, κρεμμύδι, ελαιόλαδο ~45′ στους 180°C.": "Bake with tomato, onion and olive oil for about 45 min at 180°C.",
	"Σέρβιρε με χωριάτικη σαλάτα και ψωμί.": "Serve with Greek salad and bread.",
	"Τα όσπρια είναι το φθηνότερο και πιο χορταστικό πιάτο της εβδομάδας.": "Legumes are one of the most affordable and filling meals of the week.",
	"Μούλιασε τα ρεβίθια από το βράδυ.": "Soak the chickpeas overnight.",
	"Ψήσε με κρεμμύδι και λεμόνι ~50′.": "Bake with onion and lemon for about 50 min.",
	"Σέρβιρε με χόρτα και ψωμί στο πλάι.": "Serve with greens and bread on the side.",
	"Ψήσε σε μεγάλο ταψί — τρώγεται ζεστό ή κρύο την επόμενη μέρα.": "Bake a large tray — it is good hot or cold the next day.",
	"Μούλιασε τα φασόλια από το βράδυ.": "Soak the beans overnight.",
	"Βράσε με καρότο και σέλινο ~40′.": "Simmer with carrot and celery for about 40 min.",
	"Πρόσθεσε ντομάτα και ελαιόλαδο στο τέλος.": "Add tomato and olive oil at the end.",
	"Κλασικό ελληνικό χειμωνιάτικο πιάτο — χορταστικό και οικονομικό.": "A classic Greek winter dish — filling and economical.",
	"Άδειασε τα λαχανικά και κράτησε τη σάρκα.": "Hollow out the vegetables and keep the flesh.",
	"Ανακάτεψε ρύζι, κρεμμύδι, μυρωδικά, ελαιόλαδο.": "Mix rice, onion, herbs and olive oil.",
	"Γέμισε, σκέπασε και ψήσε 60′ στους 180°C.": "Stuff, cover and bake for 60 min at 180°C.",
	"Τρώγονται και κρύα — ιδανικά για ταπεράκι στο σχολείο.": "Also good cold — ideal for a school lunchbox.",
	"Ζύμωσε κιμά, κρεμμύδι, αυγό και μυρωδικά.": "Mix the beef with onion, egg and herbs.",
	"Πλάσε μπιφτέκια, βάλε σε ταψί με πατάτες.": "Shape into patties and place in a tray with potatoes.",
	"Ψήσε 35′ στους 200°C.": "Bake for 35 min at 200°C.",
	"Ψήσιμο στο φούρνο αντί τηγάνι: ίδια γεύση, λιγότερο λάδι.": "Bake instead of frying: similar flavour with less oil.",
	"Σέρβιρε το γιαούρτι σε μπολ.": "Serve the yogurt in a bowl.",
	"Το πιο εύκολο σνακ του σπιτιού — μηδέν προετοιμασία.": "The easiest snack in the house — zero preparation.",
	"Άλειψε το ταχίνι στο ψωμί.": "Spread tahini on the bread.",
	"Κόψε τη μπανάνα από πάνω.": "Slice the banana on top.",
	"Γρήγορος υδατάνθρακας πριν από προπόνηση — το ταχίνι προσθέτει σίδηρο και ασβέστιο.": "Quick carbohydrate before training; tahini adds iron and calcium.",
	"Χτύπησε όλα τα υλικά στο μπλέντερ.": "Blend all ingredients.",
	"Πιες μέσα σε 60′ από την προπόνηση.": "Drink within 60 min after training.",
	"Υδατάνθρακες + πρωτεΐνη + υγρά σε ένα ποτήρι, για τις ημέρες με διπλή προπόνηση.": "Carbohydrate + protein + fluids in one glass for double-training days.",
	"Κόψε τα λαχανικά σε χοντρά κομμάτια.": "Cut the vegetables into chunky pieces.",
	"Πρόσθεσε φέτα, ελιές και ελαιόλαδο.": "Add feta, olives and olive oil.",
	"Ρίγανη και ψωμί στο πλάι.": "Add oregano and serve with bread.",
	"Το ελαιόλαδο μετριέται — μία κουταλιά της σούπας είναι 15 ml, όχι «ένα αυλάκι».": "Measure the olive oil — one tablespoon is 15 ml.",
	"Κόψε τα φρούτα σε μπολ.": "Cut the fruit into a bowl.",
	"Λίγο λεμόνι για να μη μαυρίσουν.": "Add a little lemon to prevent browning.",
	"Χτύπησε όλα τα υλικά στο μπλέντερ με λίγο παγωμένο νερό.": "Blend all ingredients with a little cold water.",
	"Πιες αμέσως, κρύο.": "Drink immediately, chilled.",
	"Εύκολος τρόπος να φας πρωινό ή σνακ όταν δεν πεινάς — και χωρίς ζάχαρη.": "An easy breakfast or snack when appetite is low, without added sugar.",
	"Σέρβιρε το γιαούρτι.": "Serve the yogurt.",
	"Κόψε ένα φρούτο εποχής από πάνω.": "Slice seasonal fruit on top.",
	"Μέλι και καρύδια στο τέλος.": "Finish with honey and walnuts.",
	"Σόταρε τα λαχανικά 3′.": "Sauté the vegetables for 3 min.",
	"Ρίξε τα χτυπημένα αυγά και άφησε να δέσουν σε χαμηλή φωτιά.": "Add the beaten eggs and cook gently over low heat.",
	"Σέρβιρε με ψωμί ολικής.": "Serve with wholegrain bread.",
	"Γρήγορο βραδινό όταν γυρίζετε αργά — έτοιμο σε 12 λεπτά.": "A quick dinner for late evenings — ready in 12 min.",
	"Βρέξε ελαφρά το παξιμάδι.": "Lightly moisten the rusk.",
	"Τρίψε τη ντομάτα από πάνω.": "Grate the tomato over it.",
	"Πρόσθεσε φέτα (ή ξινομυζήθρα), ελιές και ελαιόλαδο — χωρίς επιπλέον αλάτι.": "Add feta (or xinomyzithra), olives and olive oil — no extra salt.",
	"Πλήρες βραδινό σε 6 λεπτά, χωρίς μαγείρεμα.": "A complete no-cook dinner in 6 min.",
	"Βράσε τα ζυμαρικά al dente.": "Cook the pasta al dente.",
	"Σόταρε τα λαχανικά, πρόσθεσε την ντομάτα.": "Sauté the vegetables and add the tomato.",
	"Ένωσε, πασπάλισε τυρί και σέρβιρε.": "Combine, sprinkle with cheese and serve.",
	"Ιδανικό βραδινό πριν από αγώνα την επόμενη μέρα — υδατάνθρακες για τα αποθέματα.": "Ideal the night before a game — carbohydrate to support glycogen stores.",
	"Μαρινάρε το κοτόπουλο με λεμόνι, ελαιόλαδο και ρίγανη.": "Marinate the chicken with lemon, olive oil and oregano.",
	"Ψήσε σε δυνατή φωτιά 8′ ανά πλευρά.": "Cook over high heat for 8 min per side.",
	"Τύλιξε σε πίτα με ντομάτα, κρεμμύδι και γιαούρτι αντί για έτοιμη σάλτσα.": "Wrap in pita with tomato, onion and yogurt instead of bottled sauce.",
	"Γιαούρτι αντί για έτοιμη σάλτσα: κρεμώδες, με πρωτεΐνη και χωρίς πρόσθετη ζάχαρη.": "Yogurt instead of bottled sauce: creamy, protein-rich and without added sugar.",
	"Στρώσε τα λαχανικά και τις πατάτες σε ταψί.": "Arrange the vegetables and potatoes in a tray.",
	"Βάλε το ψάρι από πάνω με λεμόνι και ελαιόλαδο.": "Place the fish on top with lemon and olive oil.",
	"Ψήσε 30′ στους 190°C.": "Bake for 30 min at 190°C.",
	"Ελαφρύ και εύπεπτο βραδινό, πλούσιο σε πρωτεΐνη — καλή επιλογή για όλη την οικογένεια.": "A light, protein-rich dinner that works well for the whole family.",
	"Σόταρε το κρεμμύδι, πρόσθεσε το σπανάκι να μαραθεί.": "Sauté the onion and add spinach until wilted.",
	"Ρίξε το ρύζι και νερό, σιγόβρασε 18′.": "Add rice and water and simmer for 18 min.",
	"Φέτα και λεμόνι στο σερβίρισμα.": "Add feta and lemon when serving.",
	"Πηγή φυλλικού οξέος και σιδήρου. Λίγο λεμόνι στο πιάτο βοηθά την απορρόφηση του σιδήρου από φυτικές τροφές.": "A source of folate and iron. Lemon can help absorption of non-haem iron from plant foods.",
	"Βράσε τον τραχανά σε νερό ή ζωμό ~12′.": "Simmer the trahana in water or stock for about 12 min.",
	"Πρόσθεσε τριμμένη ντομάτα.": "Add grated tomato.",
	"Φέτα και ελαιόλαδο στο σερβίρισμα.": "Add feta and olive oil when serving.",
	"Ζεστό, εύπεπτο βραδινό — καλό για κρύες μέρες. Ο τραχανάς είναι ήδη αλατισμένος: όχι επιπλέον αλάτι.": "A warm, easy dinner for cold days. Trahana is already salted, so do not add extra salt.",
	Συνταγές: "Recipes",
	Πρόγραμμα: "Meal plan",
	Ψώνια: "Shopping",
	Οδηγός: "Evidence",
	Προπόνηση: "Training",
	"Οικογενειακή διατροφή": "Family nutrition",
	"Οδηγός & πηγές": "Evidence & sources",
	"Η οικογένεια": "Your family",
	"Αντίγραφο ασφαλείας": "Backup",
	Επαναφορά: "Restore",
	Όνομα: "Name",
	"Ύψος (cm)": "Height (cm)",
	"Βάρος (kg)": "Weight (kg)",
	"L ροφήματα": "L drinks",
	"Το αντίγραφο επαναφέρθηκε": "Backup restored",
	"Το αρχείο δεν είναι έγκυρο αντίγραφο": "This is not a valid backup file",
	"Ανήλικος: χωρίς περιορισμό θερμίδων και χωρίς κατηγορίες BMI ενηλίκων.": "Young person: no calorie restriction and no adult BMI categories.",
	"Γιατί να εμπιστευτείς τους αριθμούς": "Where the numbers come from",
	"Κανόνες ασφαλείας": "Safety principles",
	"Η μέθοδος": "The method",
	ελέγχθηκε: "source record",
	"Καλό απόγευμα": "Good afternoon",
	"Ελληνικό οικογενειακό τραπέζι": "Greek family meal",
	"· Ημέρα": "· Day",
	"από 28": "of 28",
	"Όλα τα γεύματα της ημέρας είναι καταγεγραμμένα. Μπράβο!": "All meals are logged today. Well done!",
	"Επόμενο ·": "Next ·",
	"Το πιάτο του/της": "Portion for",
	"— ζύγισε ή μέτρησε:": "— weigh or measure:",
	"Συνταγή & μαγείρεμα →": "Recipe & cooking →",
	"Η μέρα ολοκληρώθηκε": "Day complete",
	"Τα τέσσερα γεύματα έχουν καταγραφεί. Τα λέμε αύριο!": "All four meals are logged. See you tomorrow!",
	"Η ενέργεια της ημέρας": "Today’s nutrition",
	"Εύρος στόχου": "Estimated target range",
	"Πρόγραμμα ημέρας:": "Planned today:",
	"Τα γεύματα της ημέρας": "Today’s meals",
	"kcal για": "kcal for",
	"Ένα ποτήρι": "One glass",
	"Προπόνηση σήμερα": "Training today",
	"Ατομικό πρόγραμμα μπάσκετ →": "Basketball program →",
	"Αλλάζει τους υδατάνθρακες και το νερό του": "Adjusts carbohydrates and water for",
	"Συμβουλές για σήμερα": "Today’s guidance",
	"Όλες οι συνταγές": "All recipes",
	λεπτά: "minutes",
	"Ξεκίνα μαγείρεμα": "Start cooking",
	"Το πιάτο του καθενός": "Each person’s portion",
	"Θρεπτικά για": "Nutrition for",
	Λίπος: "Fat",
	"Μερίδα αναφοράς:": "Reference serving:",
	"kcal. Τιμές από USDA FoodData Central, ενέργεια με τους συντελεστές της ΕΕ (4/4/9, ίνες 2).": "kcal. Composition from USDA FoodData Central; energy uses EU factors (4/4/9, fibre 2).",
	"Λειτουργία μαγειρέματος": "Cooking mode",
	"· Βήμα": "· Step",
	από: "of",
	"Επόμενο βήμα": "Next step",
	"Καλή όρεξη!": "Enjoy your meal!",
	"Τι θα μαγειρέψουμε;": "What’s cooking?",
	"Αναζήτηση συνταγής…": "Search recipes…",
	Όλες: "All",
	"g πρωτ.": "g protein",
	"Το πρόγραμμα της εβδομάδας": "Your weekly meals",
	Προηγούμενη: "Previous",
	Επόμενη: "Next",
	"Θερμίδες για": "Energy for",
	"· στόχος": "· estimated target",
	"· σήμερα": "· today",
	Σύνολο: "Total",
	"Τάση, όχι μία μέρα": "Trends, not a single day",
	"Μία ζύγιση είναι θόρυβος· η κλίση είναι το σήμα.": "Look at the trend across several weeks, not one weigh-in.",
	"ανά εβδομάδα": "per week",
	"Πρόσθεσε τουλάχιστον δύο ζυγίσεις": "Add at least two weigh-ins",
	"για να εμφανιστεί η τάση.": "to see a trend.",
	"Στους εφήβους το βάρος αυξάνεται φυσιολογικά με την ανάπτυξη — δεν υπάρχει στόχος απώλειας.": "Weight naturally changes during adolescent growth — there is no weight-loss target.",
	"Νέα ζύγιση": "New weigh-in",
	"Ημερολόγιο καταγραφής · 28 ημέρες": "Meal log · 28 days",
	"Πόσα από τα 4 γεύματα καταγράφηκαν κάθε μέρα.": "How many of four meals were confirmed each day.",
	τεμ: "pcs",
	"τεμ.": "pcs",
	"Η λίστα αντιγράφηκε — στείλ' τη με μήνυμα": "List copied — ready to share",
	"Λίστα για ψώνια": "Your shopping list",
	"Επόμενη εβδομάδα": "Next week",
	"Για 7 ημέρες και": "For 7 days and",
	"άτομα, με τη μερίδα του καθενός. Οι ποσότητες στρογγυλεύονται προς τα πάνω στη συσκευασία που αγοράζεις.": "people, using each person’s portion. Quantities are rounded up to the purchase pack.",
	Δευ: "Mon",
	Τρί: "Tue",
	Τετ: "Wed",
	Πέμ: "Thu",
	Παρ: "Fri",
	Σάβ: "Sat",
	Κυρ: "Sun",
	"Φωτεινό γήπεδο μπάσκετ με μπάλα και πετσέτα": "Bright basketball court with a ball and towel",
	"Μπάσκετ.": "Basketball.",
	"Πιο δυνατά,": "Stronger,",
	"με σωστό ρυθμό.": "at the right pace.",
	"· Ατομικό πρόγραμμα": "· Personal program",
	"Συμπληρώνει την ομάδα. Δεν την ανταγωνίζεται.": "Complements team practice. Never competes with it.",
	"Η εβδομάδα σου": "Your week",
	"Καταγεγραμμένες υποχρεώσεις": "Recorded commitments",
	"Χρειάζεται επιβεβαίωση ομάδας": "Team schedule needs confirmation",
	"Προηγούμενη εβδομάδα": "Previous week",
	Ομάδα: "Team",
	"Ατομικά παράθυρα": "Personal windows",
	"Συνθήκες ελέγχθηκαν": "Conditions checked",
	Ολοκληρωμένα: "Completed",
	"′ μη επιβεβαιωμένων υποχρεώσεων ομάδας. Δεν μετρούν ως επιβεβαιωμένος φόρτος.": "min of unconfirmed team commitments. Not counted as confirmed load.",
	"Πρώτα το πραγματικό πρόγραμμα της ομάδας": "Start with your actual team schedule",
	"Δεν μεταφέραμε την παλιά εβδομάδα στο σήμερα. Επιβεβαίωσε τις τωρινές υποχρεώσεις παρακάτω για να προσαρμοστούν οι ατομικές συνεδρίες.": "Past commitments are not copied into today. Confirm this week’s commitments below to adapt personal sessions.",
	"Αρχικό πρόγραμμα · 2–8 Νοεμβρίου": "Original program · 2–8 November",
	"Ιστορική εβδομάδα · προεπισκόπηση, όχι σημερινή άδεια προπόνησης. Δεν καταγράφουμε αναδρομικά ετοιμότητα.": "Historical week · preview only, not clearance for today. Readiness cannot be recorded retrospectively.",
	"Υψηλός φόρτος ομάδας: κανένα έξτρα σπριντ, άλματα ή εξαντλητική αντοχή. Οι πλήρεις συνεδρίες χρειάζονται έλεγχο από τον προπονητή της ομάδας.": "High team load: no extra sprints, jumps or exhausting conditioning. Full sessions need review by the team coach.",
	Αγώνας: "Game",
	Ανάπαυση: "Rest",
	Ολοκληρωμένη: "Completed",
	"′ παράθυρο ·": "min window ·",
	"Έναρξη συνεδρίας": "Start session",
	Προεπισκόπηση: "Preview",
	"Τα λεπτά περιλαμβάνουν προθέρμανση και ανάπαυση, όχι συνεχή άσκηση. Ακολούθησε τη δόση κάθε βήματος. Τα βίντεο δείχνουν τεχνική, όχι ένταση ή θεραπεία.": "Minutes include warm-up and rest, not continuous exercise. Follow each step’s dose. Videos demonstrate technique, not intensity or treatment.",
	"Αναίρεση ολοκλήρωσης": "Undo completion",
	"Πριν ξεκινήσεις": "Before you start",
	"Ο έλεγχος ανοίγει μόνο την ημέρα της συνεδρίας. Η ιστορική ή μελλοντική προβολή δεν δίνει άδεια εκτέλεσης.": "Check-in opens on the session date only. Historical or future previews do not grant permission to train.",
	"Επίβλεψη δύναμης": "Strength supervision",
	"Παρίσταται καταρτισμένος προπονητής και ελέγχει τεχνική και δόση.": "A qualified coach is present and checks technique and dosage.",
	"Ώρα & διάρκεια": "Time & duration",
	Έναρξη: "Start",
	"Παράθυρο (40–60′)": "Window (40–60 min)",
	"Οι έλεγχοι 9 ωρών μεταξύ υποχρεώσεων, τα περιθώρια σχολείου/ομάδας και τα όρια φόρτου είναι συντηρητικοί κανόνες του αρχικού προγράμματος — όχι κλινικά επικυρωμένο μοντέλο πρόβλεψης τραυματισμού.": "The 9-hour opportunity gate, school/team buffers and load limits are conservative program rules — not a clinically validated injury-prediction model.",
	"Τεκμηρίωση, όχι υποσχέσεις": "Evidence, not promises",
	"Επαναφέραμε το αρχικό πρόγραμμα από την έκδοση 18.1.2. Δεν αποτελεί εξατομικευμένη συνταγή ή εγγύηση αποτελέσματος. Η πρόοδος και η επιβάρυνση αποφασίζονται μαζί με τον προπονητή της ομάδας.": "The original program was restored from version 18.1.2. It is not an individualized prescription or guarantee. Progression and load should be decided with the team coach.",
	"14 σύνδεσμοι YouTube: τίτλος, κανάλι και διαθεσιμότητα επανελέγχθηκαν 15/11/2026. Δεν έγινε πλήρης ανεξάρτητος έλεγχος κάθε βίντεο. Η διαθεσιμότητα μπορεί να αλλάξει. Χωρίς ενσωμάτωση βίντεο ή αυτόματη αναπαραγωγή.": "14 YouTube links: title, channel and availability checked 15 November 2026. Full independent content review was not performed. Availability can change. No video embeds or autoplay.",
	"Βίντεο τεχνικής": "Technique video",
	"Απόφυγε:": "Avoid:",
	"Πιο εύκολα:": "Easier:",
	"Κλείσιμο συνεδρίας": "Close session",
	"Προεπισκόπηση μόνο. Δεν έχεις έγκριση εκτέλεσης για αυτή την ημέρα.": "Preview only. Conditions for execution are not met on this date.",
	ΒΗΜΑ: "STEP",
	"· ΠΑΡΑΘΥΡΟ": "· WINDOW",
	"Ο χρόνος περιλαμβάνει διαλείμματα. Οι επαναλήψεις είναι αυτές του βήματος — δεν συνεχίζεις μέχρι να τελειώσει ο χρόνος.": "Time includes rest. Do only the step’s prescribed repetitions — do not exercise continuously until the timer ends.",
	Παύση: "Pause",
	Χρονόμετρο: "Timer",
	"Μηδενισμός χρόνου": "Reset timer",
	"Ολοκλήρωσα τη συνεδρία": "I completed this session",
	"Πόνος, ζάλη ή αδιαθεσία → διακοπή. Πρώτα ο γονέας/προπονητής, όχι το χρονόμετρο.": "Pain, dizziness or feeling unwell → stop. Contact a parent/coach; the timer is never the priority.",
	"Ο σημερινός έλεγχος αποθηκεύτηκε": "Today’s check-in saved",
	"Πραγματικός ύπνος (ώρες)": "Actual sleep (hours)",
	"π.χ. 8,5": "e.g. 8.5",
	Επίλεξε: "Select",
	"Πολύ χαμηλή": "Very low",
	Χαμηλή: "Low",
	Μέτρια: "Moderate",
	Καλή: "Good",
	"Πολύ καλή": "Very good",
	"Μυϊκό πιάσιμο": "Muscle soreness",
	Καθόλου: "None",
	Λίγο: "Mild",
	Μέτριο: "Moderate",
	Έντονο: "High",
	"Πολύ έντονο": "Very high",
	"Έχω πόνο ή αδιαθεσία": "I have pain or feel unwell",
	"Αποθήκευση ελέγχου": "Save check-in",
	"Ειλικρινής καταγραφή, όχι βαθμολογία υγείας. Για έφηβο: 8–10 ώρες ύπνου. Οι απαντήσεις δεν αντικαθιστούν αξιολόγηση προπονητή ή γιατρού.": "Honest reporting, not a health score. Teens need 8–10 hours of sleep. Answers do not replace professional assessment.",
	"Πρόγραμμα ομάδας & σχολείου · επεξεργασία": "Team & school schedule · edit",
	Σχολείο: "School",
	"· μη επιβεβαιωμένο": "· unconfirmed",
	"Η λήξη πρέπει να είναι μετά την αρχή": "End time must follow start time",
	Μπάσκετ: "Basketball",
	Ημέρα: "Day",
	Υποχρέωση: "Commitment",
	Αρχή: "Start",
	Τέλος: "End",
	Προσθήκη: "Add",
	"Το πρόγραμμα της εβδομάδας επιβεβαιώθηκε": "This week’s schedule is confirmed",
	"Επιβεβαίωση εβδομάδας": "Confirm week",
	"Εισαγωγή ημερολογίου .ics": "Import .ics calendar",
	"Δεν βρέθηκαν υποστηριζόμενες υποχρεώσεις σχολείου ή μπάσκετ": "No supported school or basketball commitments were found",
	"Τεχνική δύναμης": "Strength technique",
	"Κινητικότητα & αποκατάσταση": "Mobility & recovery",
	"Έλεγχος κίνησης": "Movement control",
	"Συνθήκες καταγεγραμμένες": "Conditions reported",
	"Μόνο ήπια αποκατάσταση": "Gentle recovery only",
	"Δεν εκτελείται": "Do not perform",
	"Έλεγχος πριν ξεκινήσεις": "Check in before starting",
	"Χρειάζεται επίβλεψη": "Supervision required",
	Ανενεργή: "Disabled",
	"Χρειάζεται σημερινός έλεγχος ύπνου, ενέργειας και πόνου.": "Today’s sleep, energy and pain check-in is required.",
	"Η ενδυνάμωση χρειάζεται παρόντα, καταρτισμένο προπονητή.": "Strength requires a qualified coach to be present.",
	"Το διάστημα από την προηγούμενη προπόνηση είναι κάτω από 9 ώρες. Μετακίνησε τη συνεδρία — ο ύπνος προηγείται.": "Less than 9 hours since the previous practice. Move this session — sleep comes first.",
	"Η συνεδρία συμπίπτει με σχολείο ή ομαδική προπόνηση.": "This session overlaps school or team practice.",
	"Δεν μένει αρκετός χρόνος πριν ή μετά το σχολείο.": "Insufficient time before or after school.",
	"Δεν μένουν 2 ώρες μέχρι την ομαδική προπόνηση.": "Less than 2 hours before team practice.",
	"Αναφέρθηκε πόνος. Σταμάτησε, ενημέρωσε γονέα/προπονητή και ζήτησε επαγγελματική αξιολόγηση.": "Pain reported. Stop, tell a parent/coach and seek professional assessment.",
	"Λίγος ύπνος, χαμηλή ενέργεια ή έντονο πιάσιμο: σήμερα προέχει η ανάπαυση.": "Poor sleep, low energy or marked soreness: prioritize rest today.",
	"Σήμα κόπωσης: δεν προσθέτουμε προσωπική συνεδρία.": "Fatigue reported: do not add a personal session.",
	"Πολύ υψηλός ομαδικός φόρτος. Μην προσθέτεις άλλη συνεδρία.": "Very high team load. Do not add another session.",
	"Οι δηλωμένες συνθήκες περνούν τα συντηρητικά φίλτρα. Δεν αποτελεί ιατρική ή προπονητική έγκριση.": "Reported conditions pass conservative filters. This is not medical or coaching clearance.",
	"Οι πρόσθετες συνεδρίες είναι απενεργοποιημένες.": "Supplemental sessions are disabled.",
	"Κρεοπωλείο & ψάρια": "Meat & fish",
	"Ξηρά, λάδια & κονσέρβες": "Pantry, oils & canned food",
	Αρτοποιείο: "Bakery",
	Ξεκούραση: "Rest",
	Ελαφριά: "Light",
	Κανονική: "Normal",
	Σκληρή: "Hard",
	"Τουρνουά / διπλή": "Tournament / double session",
	"Εκπαιδευτικό εργαλείο ευεξίας — δεν αποτελεί ιατρική φροντίδα, διάγνωση ή θεραπεία.": "Educational wellbeing tool — not medical care, diagnosis or treatment.",
	"Κανένα έλλειμμα θερμίδων και καμία κατηγορία BMI ενηλίκων σε προφίλ κάτω των 20 ετών.": "No calorie deficit and no adult BMI classification for profiles younger than 20.",
	"Το μέγεθος πιάτου ενός μέλους δεν πέφτει ποτέ κάτω από τη μερίδα αναφοράς για να «πιάσει» έναν στόχο.": "A member’s plate is never reduced below the reference serving merely to hit a target.",
	"Οι μετρήσεις αξιολογούνται ως τάση 3–4 εβδομάδων, ποτέ μεμονωμένα.": "Assess measurements as a 3–4 week trend, never in isolation.",
	"Τα δεδομένα μένουν στη συσκευή. Δεν υπάρχει λογαριασμός, διακομιστής ή παρακολούθηση.": "Data stays on this device. No account, server-side data storage or tracking.",
	"Σε εγκυμοσύνη, διαβήτη, νεφρική ή καρδιακή νόσο, διατροφική διαταραχή ή φαρμακευτική αγωγή: συμβουλέψου επαγγελματία υγείας πριν αλλάξεις τη διατροφή σου.": "For pregnancy, diabetes, kidney or heart disease, eating disorders or medication: seek professional advice before changing your diet.",
	"Ενέργεια ενηλίκων": "Adult energy",
	"Εξίσωση Mifflin–St Jeor για την ενέργεια ηρεμίας × επίπεδο δραστηριότητας (1,4 · 1,6 · 1,8 · 2,0, όπως στην EFSA). Σταδιακή απώλεια λίπους = −12% της συντήρησης, δηλαδή περίπου 250 kcal την ημέρα. Εμφανίζεται πάντα ως εύρος ±6%, ποτέ ως ένας «μαγικός» αριθμός.": "Mifflin–St Jeor resting energy × activity factor (1.4, 1.6, 1.8, 2.0). Gradual adult fat loss uses 12% below maintenance. The estimate is shown as a ±6% range, not a precise measurement.",
	"Ενέργεια εφήβων": "Adolescent energy",
	"Εξίσωση Schofield (FAO/WHO/UNU) για ηλικίες 10–18 × επίπεδο δραστηριότητας — για αθλητή, ανάλογα με το φορτίο προπόνησης. Το εύρος είναι ±10% και συμφωνεί με τις Μέσες Ανάγκες της EFSA για την ηλικία. Δεν εφαρμόζεται ποτέ έλλειμμα σε ανήλικο προφίλ και δεν εμφανίζεται κατηγορία BMI ενηλίκων κάτω των 20 ετών.": "Schofield (FAO/WHO/UNU) for ages 10–18 × activity level; athlete load affects the multiplier. The estimate uses a ±10% range. No deficits for minors and no adult BMI categories below age 20.",
	"Πώς κλιμακώνονται οι μερίδες": "How portions are scaled",
	"Κάθε συνταγή είναι γραμμένη σε γραμμάρια υλικών για μία μερίδα αναφοράς. Κάθε υλικό ανήκει σε ομάδα πιάτου (πρωτεΐνη, υδατάνθρακες, λιπαρά, λαχανικά) και κλιμακώνεται με τον συντελεστή του κάθε μέλους — π.χ. λιγότερο ρύζι και περισσότερα λαχανικά για όποιον προσέχει τη ζυγαριά. Το μέγεθος του πιάτου προσαρμόζεται ώστε ο κύκλος των 28 ημερών να πέφτει στο κέντρο της εκτιμώμενης ενεργειακής ανάγκης: ποτέ κάτω από ×1,0, ποτέ για ενήλικα σε πρόγραμμα απώλειας και με ανώτατο ×1,5.": "Recipes specify grams for one reference serving. Ingredients scale by plate group and member. The 28-day average calibrates plate size between ×1.0 and ×1.5; adult fat-loss profiles are not enlarged to hit the average.",
	"Θρεπτικά από τα υλικά": "Nutrients from ingredients",
	"Ενέργεια, macros, ίνες, αλάτι, σίδηρος και ασβέστιο υπολογίζονται από τα γραμμάρια κάθε υλικού × τη σύστασή του (USDA FoodData Central). Η ενέργεια βγαίνει πάντα από τα macros με τους συντελεστές των ετικετών της ΕΕ: πρωτεΐνη και υδατάνθρακες 4, λιπαρά 9, φυτικές ίνες 2 kcal/g (οι υδατάνθρακες δεν περιλαμβάνουν τις ίνες). Συγκρίνονται με τιμές αναφοράς της EFSA (ίνες, σίδηρος, ασβέστιο) και του ΠΟΥ (αλάτι κάτω από 5 g). Το αλάτι που προσθέτεις εσύ στο μαγείρεμα δεν υπολογίζεται.": "Nutrients are derived from grams × USDA composition. Energy uses EU factors: protein 4, available carbohydrate 4, fat 9 and fibre 2 kcal/g. Compare fibre, iron and calcium with EFSA reference values; salt with WHO guidance. Added cooking salt is not counted.",
	"Ο στόχος ροφημάτων είναι το 80% της Επαρκούς Πρόσληψης νερού της EFSA για την ηλικία και το φύλο (2,0 L για γυναίκες και κορίτσια 14+, 2,5 L για άνδρες και αγόρια 14+) — το υπόλοιπο προέρχεται συνήθως από τα τρόφιμα. Οι αθλητές προσθέτουν υγρά για την προπόνηση. Δεν είναι ιατρική συνταγή: η ανάγκη αλλάζει με τη ζέστη, την εφίδρωση, την ασθένεια και τα φάρμακα.": "Drink planning uses 80% of EFSA adequate total water intake for age and sex; food usually supplies the remainder. Athlete fluids increase with training. Heat, illness, sweat and medicines change needs. This is not a medical prescription.",
	"Τι δεν κάνει η εφαρμογή": "What this app does not do",
	"Δεν μετράει κατανάλωση χωρίς επιβεβαίωση, δεν βάζει αυθαίρετο «health score», δεν δίνει στόχο απώλειας βάρους σε ανήλικο και δεν αντικαθιστά ιατρική φροντίδα. Όλα τα νούμερα είναι εκτιμήσεις προγραμματισμού, όχι μετρήσεις.": "No intake is counted without confirmation. No invented health score, no weight-loss targets for minors, and no replacement for medical care. Figures are planning estimates, not measurements.",
	"Τιμές αναφοράς ανά ηλικία και φύλο: ίνες, ασβέστιο, σίδηρος, νερό και πρωτεΐνη· μέσες ανάγκες ενέργειας.": "Age- and sex-specific reference values for fibre, calcium, iron, water and protein; average energy requirements.",
	"Αλάτι κάτω από 5 g (2 g νατρίου) την ημέρα, τουλάχιστον 400 g φρούτων και λαχανικών, τουλάχιστον 25 g ίνες.": "Healthy diet guidance: less than 5 g salt (2 g sodium), at least 400 g fruit and vegetables, and at least 25 g fibre per day.",
	"Σύσταση κάθε τροφίμου ανά 100 g: πρωτεΐνη, υδατάνθρακες, λίπος, ίνες, νάτριο, σίδηρος, ασβέστιο.": "Composition per 100 g: protein, carbohydrate, fat, fibre, sodium, iron and calcium.",
	"Συντελεστές ενέργειας όπως στις ετικέτες (4/4/9 kcal/g, ίνες 2 kcal/g) και τιμές αναφοράς της ΕΕ (σίδηρος 14 mg, ασβέστιο 800 mg) για τα σήματα «πλούσιο σε…».": "EU food-label energy factors (4/4/9 kcal/g plus fibre 2 kcal/g) and reference intakes for nutrition claims.",
	"Εξίσωση ενέργειας ηρεμίας για ενήλικες.": "Resting energy equation for adults.",
	"Εξίσωση ενέργειας ηρεμίας για ηλικίες 10–18 ετών.": "Resting energy equation for ages 10–18.",
	"Γιατί το BMI ενηλίκων δεν ισχύει κάτω των 20 ετών: χρησιμοποιούνται ποσοστιαίες θέσεις BMI ανά ηλικία και φύλο.": "Why adult BMI categories are inappropriate below age 20: use age- and sex-specific BMI percentiles.",
	"Υδατάνθρακες πριν και μετά την προπόνηση (1–4 g/kg πριν), πρωτεΐνη μετά την άσκηση, αναπλήρωση υγρών 125–150%.": "Carbohydrate around training, protein after exercise and fluid replacement guidance.",
	"Πρωτεΐνη αθλητών 1,4–2,0 g/kg την ημέρα· η εφαρμογή σχεδιάζει στο 1,4–1,8 g/kg.": "Athlete protein range 1.4–2.0 g/kg/day; the app plans within 1.4–1.8 g/kg.",
	"Αθλητική διατροφή εφήβων: η επάρκεια ενέργειας προηγείται, όχι ο περιορισμός.": "Adolescent athletes: energy adequacy comes first, not restriction.",
	"Διαθεσιμότητα ενέργειας σε νεαρούς αθλητές.": "Energy availability in young athletes.",
	"Το βάρος αλλάζει σταδιακά με το ενεργειακό ισοζύγιο· γι’ αυτό κρίνουμε τάση εβδομάδων και όχι μία μέτρηση.": "Body weight changes gradually; assess multiweek trends rather than one measurement.",
	"Οι τρεις θερμιδογόνες ομάδες: πρωτεΐνη (4 kcal/g), υδατάνθρακες (4 kcal/g, χωρίς τις ίνες) και λιπαρά (9 kcal/g). Οι φυτικές ίνες μετρούν 2 kcal/g.": "Protein, available carbohydrate and fat provide 4/4/9 kcal per gram; fibre contributes 2 kcal/g.",
	"Η ποσότητα ενός υλικού για έναν μέσο ενήλικα, πριν την προσαρμογή στο μέλος.": "The amount of an ingredient in the reference serving before member-specific scaling.",
	"Πόσο μεγάλο είναι το πιάτο κάποιου σε σχέση με τη μερίδα αναφοράς, ώστε το πλάνο να καλύπτει την εκτιμώμενη ενέργειά του (×1,0 έως ×1,5).": "Plate size relative to the reference serving, scaled from ×1.0 to ×1.5 to plan adequate energy.",
	"Πόσο απαιτητική είναι η σημερινή προπόνηση. Αλλάζει υδατάνθρακες και υγρά — ποτέ τις θερμίδες ανήλικου προς τα κάτω.": "How demanding today’s training is; adjusts carbohydrate and fluids, never imposes a deficit on a minor.",
	"Πολλαπλασιαστής της ενέργειας ηρεμίας: 1,4 = χαμηλή δραστηριότητα, 1,6 = μέτρια, 1,8 = δραστήρια, 2,0 = πολύ δραστήρια.": "Resting-energy multiplier: 1.4 low, 1.6 moderate, 1.8 active, 2.0 very active.",
	"Τιμές της EFSA για το τι πρέπει να παίρνει καθημερινά σχεδόν όλος ο πληθυσμός μιας ηλικίας και φύλου. Το «όριο» για το αλάτι είναι αντίστροφο: ό,τι δεν πρέπει να ξεπερνάς.": "EFSA age- and sex-specific adequate/reference intake values. Salt is a maximum, not a target to fill.",
	"Πώς τα macros γίνονται θερμίδες, όπως στις ετικέτες των τροφίμων της ΕΕ: 4/4/9 kcal ανά γραμμάριο και 2 για τις ίνες.": "EU food-label conversion: 4/4/9 kcal per gram and 2 for fibre.",
	"Σχετική ανεπάρκεια ενέργειας στον αθλητισμό — κίνδυνος σε νεαρούς αθλητές με χαμηλή ενεργειακή διαθεσιμότητα.": "Relative Energy Deficiency in Sport: risk associated with inadequate energy availability.",
	"Προπόνηση οικογένειας": "Family training",
	στόχος: "target",
	"κάτω από": "below",
	Ποτήρι: "Glass",
	Έφαγα: "I ate",
	συνταγές: "recipes",
	"από 4 γεύματα σήμερα": "of 4 meals today",
	Καταγράφηκαν: "Logged",
	"Χαμηλής έντασης": "Low intensity",
	Μέγεθος: "Size",
	Βασικό: "Basic",
	"Πλούσιο σε ασβέστιο": "High calcium",
	"Πλούσιο σε πρωτεΐνη": "High protein",
	Γιαούρτι: "Yogurt",
	"Λεμόνι / χυμός": "Lemon / juice",
	"Προσοχή στο αλάτι.": "Pay attention to salt.",
	"Στόχος ρυθμού, όχι ταχύτητας.": "Consistency, not speed.",
	"Ποικιλία & σίδηρος.": "Variety & iron.",
	"Διπλές προπονήσεις Τρ/Πε.": "Double practices Tue/Thu.",
	"Κοτόπουλο με ρύζι & λαχανικά στο φούρνο": "Oven chicken with rice & vegetables",
	"Φασολάδα με ελαιόλαδο": "Bean soup with olive oil",
	"Χωριάτικη με φέτα": "Greek salad with feta",
	"Φρουτοσαλάτα εποχής": "Seasonal fruit salad",
	"Ομελέτα λαχανικών & ψωμί": "Vegetable omelette & bread",
	"Στόχος: τουλάχιστον 400 g φρούτων και λαχανικών την ημέρα (5 μερίδες) — ο ελάχιστος στόχος του ΠΟΥ.": "Aim for at least 400 g of fruit and vegetables daily — WHO’s minimum recommendation.",
	"Το μέλι μετριέται: 10 g είναι περίπου ενάμισι κουταλάκι του γλυκού, όχι ελεύθερη ροή.": "Measure honey: 10 g is roughly one and a half teaspoons, not a free pour.",
	"Ήπιο εκτιμώμενο έλλειμμα. Προσάρμοσε μόνο από τάση πολλών εβδομάδων, πείνα και λειτουργικότητα — όχι από μία μέτρηση.": "Mild estimated deficit. Adjust using multiweek trends, hunger and daily function — not one measurement.",
	"Υψηλό εύρος BMI ενηλίκων": "Above the adult BMI reference range",
	"Εντός εύρους ενηλίκων": "Within the adult reference range",
	"Εκτιμώμενο εύρος συντήρησης": "Estimated maintenance range",
	"Ευρεία εκτίμηση ανάπτυξης/απόδοσης — ποτέ στόχος περιορισμού θερμίδων για ανήλικο.": "Broad growth/performance estimate — never a calorie-restriction target for a minor.",
	"Χρησιμοποίησε την τάση 3–4 εβδομάδων, όχι μία ημέρα, πριν μειώσεις περαιτέρω τις μερίδες.": "Consider a 3–4 week trend, not one day, before any further portion adjustment.",
	"Δεν χρησιμοποιείται περιορισμός θερμίδων ή κατηγορία BMI ενηλίκων σε αυτό το προφίλ.": "No calorie restriction or adult BMI classification is used for this profile.",
	"Δώσε προτεραιότητα στους υδατάνθρακες πριν και μετά την προπόνηση, μαζί με ένα κανονικό γεύμα με πρωτεΐνη.": "Prioritize carbohydrate around training alongside a regular meal with protein.",
	"Σήμα αποκατάστασης: ο ύπνος που καταγράφηκε είναι κάτω από 8 ώρες σε προφίλ υψηλών απαιτήσεων.": "Recovery signal: recorded sleep is below 8 hours for a high-demand profile.",
	"Η ενυδάτωση που καταγράφηκε είναι πίσω από την αρχική εκτίμηση της ημέρας.": "Recorded hydration is behind today’s initial planning estimate.",
	Αλμυρό: "Higher salt",
	"Μερίδα αναφοράς": "Reference serving",
	"Φορτίο προπόνησης": "Training load",
	"Επίπεδο δραστηριότητας (PAL)": "Physical activity level (PAL)",
	"Επαρκής Πρόσληψη (AI) · Πρόσληψη Αναφοράς (PRI)": "Adequate Intake (AI) · Population Reference Intake (PRI)",
	"Συντελεστές ενέργειας": "Energy conversion factors",
	"στο καλάθι": "in the basket",
	"υποχρεώσεις εισήχθησαν": "commitments imported",
	"Εβδομάδα ": "Week ",
	"Κίνηση & κινητικότητα": "Movement & mobility",
	"AAP · Ενδυνάμωση παιδιών και εφήβων (2020, επιβεβαίωση 2024)": "AAP · Resistance training in children and adolescents (2020, reaffirmed 2024)",
	"Επίβλεψη, εκμάθηση τεχνικής και σταδιακή πρόοδος. Η δόση χρειάζεται προσαρμογή από εξειδικευμένο προπονητή.": "Supervision, learning technique and gradual progression. Training dose requires adaptation by a qualified coach.",
	"Περιεχόμενο μέσω ευρετηρίου εκδότη · 15/11/2026": "Content through publisher index · 15 November 2026",
	"AAP · Υπέρχρηση, υπερπροπόνηση και εξουθένωση (2024)": "AAP · Overuse injuries, overtraining and burnout (2024)",
	"Ο συνολικός φόρτος ομάδας και ατομικής προπόνησης χρειάζεται επαρκή αποκατάσταση και ημέρες ανάπαυσης.": "Combined team and individual training load requires adequate recovery and rest days.",
	"CDC · Ύπνος εφήβων": "CDC · Teen sleep",
	"Για ηλικίες 13–17: 8–10 ώρες ύπνου ανά 24ωρο. Το χρονικό διάστημα μεταξύ υποχρεώσεων δεν ισούται με πραγματικό ύπνο.": "Ages 13–17: 8–10 hours of sleep per 24 hours. Time between commitments does not equal actual sleep.",
	"Άμεση ανάγνωση πηγής · 15/11/2026": "Source read directly · 15 November 2026",
	"Διεθνής συναίνεση · Youth resistance training (2014)": "International consensus · Youth resistance training (2014)",
	"Εκπαίδευση από καταρτισμένο επαγγελματία, σωστή τεχνική και ατομική προσαρμογή πριν αυξηθεί το φορτίο.": "Instruction by a qualified professional, correct technique and individual adaptation before increasing load.",
	"Ταυτότητα δημοσίευσης επιβεβαιωμένη · πλήρες κείμενο όχι ανεξάρτητα επανελεγμένο": "Publication identity confirmed · full text not independently re-reviewed",
	"Ψωμί ολικής με ταχίνι, μέλι & μπανάνα": "Wholegrain toast with tahini, honey & banana",
	"Το ταχίνι δίνει ασβέστιο και σίδηρο· το γάλα συμπληρώνει την πρωτεΐνη.": "Tahini adds calcium and iron; the milk completes the protein.",
	"Άλειψε το ταχίνι στο ψημένο ψωμί.": "Spread the tahini on the toasted bread.",
	"Πρόσθεσε μπανάνα σε ροδέλες και λίγο μέλι.": "Top with sliced banana and a little honey.",
	"Σέρβιρε με ένα ποτήρι γάλα.": "Serve with a glass of milk.",
	"Γιαούρτι με βρώμη, μέλι & καρύδια": "Yogurt with oats, honey & walnuts",
	"Πρωτεΐνη γιαουρτιού και υδατάνθρακες βρώμης κρατούν ενέργεια ώς το μεσημέρι.": "Yogurt protein and oat carbohydrate keep energy steady until lunch.",
	"Βάλε το γιαούρτι σε μπολ και πρόσθεσε τη βρώμη.": "Put the yogurt in a bowl and add the oats.",
	"Ρίξε μέλι και καρύδια στο τέλος.": "Finish with honey and walnuts.",
	"Ομελέτα με πιπεριά, μανιτάρια & ψωμί": "Pepper & mushroom omelette with bread",
	"Τα λαχανικά από το πρωί βοηθούν να φτάσει η οικογένεια τις 5 μερίδες.": "Vegetables at breakfast help the family reach five portions a day.",
	"Σόταρε πιπεριά και μανιτάρια στο ελαιόλαδο 4′.": "Sauté the pepper and mushrooms in olive oil for 4 minutes.",
	"Ρίξε τα χτυπημένα αυγά και ψήσε σε χαμηλή φωτιά.": "Pour in the beaten eggs and cook on low heat.",
	"Ζυμαρικά ολικής με κοτόπουλο & ντομάτα": "Wholegrain pasta with chicken & tomato",
	"Καλό γεύμα μετά από προπόνηση: υδατάνθρακες για αναπλήρωση και πρωτεΐνη για αποκατάσταση.": "A good post-training meal: carbohydrate to refuel and protein for recovery.",
	"Σόταρε κρεμμύδι και κοτόπουλο σε κύβους στο ελαιόλαδο.": "Sauté onion and diced chicken in olive oil.",
	"Πρόσθεσε τη ντομάτα και σιγόβρασε 12′.": "Add the tomato and simmer for 12 minutes.",
	"Ανακάτεψε με τα βρασμένα ζυμαρικά και πασπάλισε τυρί.": "Toss with the boiled pasta and sprinkle with cheese.",
	"Μοσχάρι κοκκινιστό με ρύζι": "Braised beef in tomato with rice",
	"Το κόκκινο κρέας δίνει σίδηρο που απορροφάται εύκολα· μία φορά την εβδομάδα αρκεί.": "Red meat supplies easily absorbed iron; once a week is enough.",
	"Σοτάρισε το μοσχάρι με το κρεμμύδι στο ελαιόλαδο.": "Brown the beef with the onion in olive oil.",
	"Πρόσθεσε ντομάτα, καρότο και νερό· σιγόβρασε ~50′.": "Add tomato, carrot and water; simmer about 50 minutes.",
	"Σέρβιρε με βρασμένο ρύζι.": "Serve with boiled rice.",
	"Σαλάτα ρεβιθιών με λαχανικά & φέτα": "Chickpea salad with vegetables & feta",
	"Το λεμόνι (βιταμίνη C) βοηθά την απορρόφηση του σιδήρου από τα όσπρια.": "Lemon (vitamin C) helps absorb the iron in legumes.",
	"Κόψε ντομάτα, αγγούρι και πιπεριά.": "Chop the tomato, cucumber and pepper.",
	"Ανακάτεψε με ελαιόλαδο, λεμόνι και φέτα· σέρβιρε με ψωμί.": "Dress with olive oil and lemon, add feta and serve with bread.",
	"Γιαούρτι με φρούτο & καρύδια": "Yogurt with fruit & walnuts",
	"Γρήγορο σνακ με πρωτεΐνη για το απόγευμα.": "A quick protein snack for the afternoon.",
	"Βάλε το γιαούρτι σε μπολ.": "Put the yogurt in a bowl.",
	"Πρόσθεσε φρούτο και καρύδια.": "Add the fruit and walnuts.",
	"Παξιμάδι με ντομάτα & τυρί": "Rusk with tomato & cheese",
	"Η φέτα έχει αλάτι — μην προσθέσεις επιπλέον.": "Feta is salty; do not add more salt.",
	"Τρίψε ντομάτα από πάνω και πρόσθεσε φέτα και ελαιόλαδο.": "Grate tomato on top and add feta and olive oil.",
	"Χούμους με λαχανικά & πίτα": "Hummus with vegetables & pita",
	"Όσπρια και σε σνακ: φυτικές ίνες και πρωτεΐνη μαζί.": "Legumes as a snack: fibre and protein together.",
	"Πολτοποίησε ρεβίθια, ταχίνι και λεμόνι με λίγο νερό.": "Blend the chickpeas, tahini and lemon with a little water.",
	"Κόψε καρότο και αγγούρι σε στικς.": "Cut the carrot and cucumber into sticks.",
	"Σέρβιρε με πίτα.": "Serve with pita.",
	"Ψάρι στον φούρνο με πατάτες & λεμόνι": "Oven-baked fish with potatoes & lemon",
	"Ψάρι δύο φορές την εβδομάδα είναι η σύσταση EFSA για ωμέγα-3.": "Fish twice a week matches the EFSA advice for omega-3.",
	"Ψήσε τις πατάτες σε κομμάτια με ελαιόλαδο 15′ στους 200°C.": "Roast the potato pieces with olive oil for 15 minutes at 200°C.",
	"Πρόσθεσε το ψάρι με λεμόνι και μυρωδικά· ψήσε ~15′ ακόμη.": "Add the fish with lemon and herbs; bake about 15 more minutes.",
	"Σέρβιρε με βραστά χόρτα.": "Serve with boiled greens.",
	"Κολοκυθάκια με αυγά & φέτα στο τηγάνι": "Pan zucchini with eggs & feta",
	"Ελαφρύ βραδινό με πρωτεΐνη, χωρίς τηγάνισμα σε πολύ λάδι.": "A light dinner with protein and no deep frying.",
	"Σόταρε τα κολοκυθάκια σε ροδέλες στο ελαιόλαδο 6′.": "Sauté sliced zucchini in olive oil for 6 minutes.",
	"Ρίξε τα χτυπημένα αυγά και τη φέτα, ανακάτευε σε χαμηλή φωτιά.": "Add the beaten eggs and feta and stir on low heat.",
	"Φασόλια σαλάτα με κρεμμύδι & μαϊντανό": "White bean salad with onion & parsley",
	"Γρήγορο βραδινό οσπρίων με ίνες που κρατούν τον κορεσμό.": "A quick legume dinner with fibre that keeps you full.",
	"Πρόσθεσε ψιλοκομμένο κρεμμύδι, μαϊντανό και ντομάτα.": "Add chopped onion, parsley and tomato.",
	"Ντύσε με ελαιόλαδο και λεμόνι· σέρβιρε με ψωμί.": "Dress with olive oil and lemon; serve with bread.",
	"Μούλιασε και βράσε τα ρεβίθια (οι ποσότητες είναι ξερό βάρος).": "Soak and boil the chickpeas (quantities are dry weight).",
	"Μούλιασε και βράσε τα φασόλια (οι ποσότητες είναι ξερό βάρος).": "Soak and boil the beans (quantities are dry weight)."
};
var phrases = Object.keys(dictionary).filter((key) => key.length >= 3).sort((a, b) => b.length - a.length);
function translate(text, language) {
	if (!text) return "";
	if (language === "el" || !text) return text;
	if (dictionary[text]) return dictionary[text];
	const trimmed = text.trim();
	if (dictionary[trimmed]) return text.replace(trimmed, dictionary[trimmed]);
	let result = text;
	for (const key of phrases) {
		const replacement = dictionary[key];
		if (replacement === void 0) continue;
		const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		result = result.replace(new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "gu"), () => replacement);
	}
	return result;
}
function useI18n() {
	const language = useStore((s) => s.language ?? "el");
	return {
		language,
		t: (text) => translate(text, language),
		pick: (el, en) => language === "en" ? en : el
	};
}
//#endregion
export { AISLES as A, RECIPES as B, referenceValues as C, weightTrend as D, targetsFor as E, SLOTS as F, Button as H, SLOT_LABEL as I, SLOT_TIME as L, GOALS as M, METHOD as N, addDays as O, SAFETY as P, SOURCES as R, nutritionBadges as S, scaledIngredients as T, cn as U, qtyOf as V, contextualGuidance as _, recipeById as a, kcalFromMacros as b, todayKey as c, useStore as d, withPlate as f, canUseAdultBmi as g, buildShoppingList as h, planFor as i, GLOSSARY as j, mondayOf as k, updateLog as l, bmi as m, getLog as n, restoreState as o, adultBmiLabel as p, loadOf as r, setState as s, useI18n as t, useSaveStatus as u, dayMacros as v, saltGrams as w, mealMacros as x, isMinor as y, TRAINING_LOADS as z };
