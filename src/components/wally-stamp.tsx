import wallyImage from "../../initialApp/public/images/wally.png";

interface WallyStampProps {
  collected?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-9 h-9",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const WallyStamp = ({ collected = false, size = "md", className = "" }: WallyStampProps) => {
  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-full border-2 overflow-hidden shadow-md ${
        collected
          ? "border-accent bg-accent/15"
          : "border-primary-foreground/35 bg-foreground/20"
      } ${className}`.trim()}
      aria-hidden="true"
    >
      <img
        src={wallyImage}
        alt=""
        className={`w-full h-full object-cover object-top ${collected ? "" : "grayscale opacity-45"}`}
      />
      {!collected && (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20 text-primary-foreground text-sm font-bold">
          ?
        </div>
      )}
    </div>
  );
};

export default WallyStamp;
