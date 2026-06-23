import { Icon } from "./Icon";

type Props = {
  /** Error message; renders nothing when empty so callers can pass conditionally. */
  message?: string;
  id?: string;
};

export function FormError({ message, id }: Props) {
  if (!message) return null;
  return (
    <p className="form-error" id={id} role="alert">
      <Icon name="alert" size={15} className="form-error__icon" />
      <span>{message}</span>
    </p>
  );
}
