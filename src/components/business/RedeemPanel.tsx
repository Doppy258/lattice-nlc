import { useEffect, useState } from "react";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { formatCurrency } from "../../utils/formatting";

export type RedeemView =
  | { ok: true; code: string; offerTitle: string; customerName: string; price: number }
  | { ok: false; error: string }
  | null;

type Props = {
  result: RedeemView;
  onSubmit: (code: string) => void;
  onClear: () => void;
};

/** Code-entry panel for verifying a customer's PING-#### claim at the counter. */
export function RedeemPanel({ result, onSubmit, onClear }: Props) {
  const [code, setCode] = useState("");

  // Clear the field after a successful redemption so the next code starts fresh.
  useEffect(() => {
    if (result?.ok) setCode("");
  }, [result]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) onSubmit(code);
  };

  return (
    <div className="redeem-panel">
      <form className="redeem-panel__form" onSubmit={submit}>
        <label className="field__label" htmlFor="redeem-code">
          Enter claim code
        </label>
        <div className="redeem-panel__row">
          <input
            id="redeem-code"
            className="text-input redeem-panel__input mono"
            value={code}
            placeholder="PING-1234"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (result) onClear();
            }}
          />
          <Button type="submit" disabled={!code.trim()} iconLeft={<Icon name="redeem" size={16} />}>
            Verify
          </Button>
        </div>
        <span className="field__hint">
          <Icon name="alert" size={12} /> Codes are case-insensitive and look like PING-1234.
        </span>
      </form>

      {result?.ok && (
        <div className="redeem-result redeem-result--ok">
          <span className="redeem-result__icon">
            <Icon name="check" size={20} />
          </span>
          <div>
            <p className="redeem-result__title">Redeemed {result.code}</p>
            <p className="redeem-result__detail">
              {result.customerName} - {result.offerTitle} -{" "}
              {result.price === 0 ? "Free" : formatCurrency(result.price)}
            </p>
          </div>
        </div>
      )}

      {result && !result.ok && (
        <div className="redeem-result redeem-result--error">
          <span className="redeem-result__icon">
            <Icon name="alert" size={20} />
          </span>
          <p className="redeem-result__detail">{result.error}</p>
        </div>
      )}
    </div>
  );
}
