interface Props {
  message: string;
  isError: boolean;
}

export default function StatusBar({ message, isError }: Props) {
  return (
    <footer
      className={`shrink-0 px-6 py-1.5 bg-bg-secondary border-t border-border text-xs ${isError ? "text-red" : "text-green"}`}
    >
      {message}
    </footer>
  );
}
