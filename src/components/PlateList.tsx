import { qtyOf } from "@/engine/foods";
import { scaledIngredients } from "@/engine/nutrition-engine";
import { nf } from "@/lib/format";
import type { Profile } from "@/lib/store";

export function PlateList({ recipe, profile, load, portion = 1 }: { recipe: any; profile: Profile; load: string; portion?: number }) {
  const lines = scaledIngredients(recipe, profile, load, portion);
  return (
    <ul className="divide-y divide-border/70">
      {lines.map(({ ing, g }, i) => {
        const q = qtyOf(ing, g);
        const unit = ing.u === "τεμ" ? "τεμ." : ing.u;
        return (
          <li key={i} className="flex items-baseline justify-between gap-3 py-2 text-[15px]">
            <span>{ing.n}</span>
            <span className="tabular shrink-0 font-semibold">
              {ing.u === "τεμ" ? nf(q, 1) : nf(Math.round(q / 5) * 5)} <span className="font-normal text-muted-foreground">{unit}</span>
              {ing.u !== "g" && <span className="ml-1 text-xs font-normal text-muted-foreground">({nf(Math.round(g))} g)</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
