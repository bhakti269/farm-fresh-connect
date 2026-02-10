interface StepCardProps {
  step: number;
  title: string;
  description: string;
  isLast?: boolean;
}

const StepCard = ({ step, title, description, isLast = false }: StepCardProps) => {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
          {step}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-border mt-2" />
        )}
      </div>
      <div className="pb-8">
        <h4 className="font-serif font-semibold text-lg text-foreground mb-1">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default StepCard;
