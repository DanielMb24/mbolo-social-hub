import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}>
      {children}
    </div>
  );
};

export const FadeIn = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  return (
    <div 
      className="animate-in fade-in duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const SlideIn = ({ 
  children, 
  direction = "bottom",
  delay = 0 
}: { 
  children: ReactNode; 
  direction?: "top" | "bottom" | "left" | "right";
  delay?: number;
}) => {
  const directionClass = {
    top: "slide-in-from-top-4",
    bottom: "slide-in-from-bottom-4",
    left: "slide-in-from-left-4",
    right: "slide-in-from-right-4",
  }[direction];

  return (
    <div 
      className={`animate-in fade-in ${directionClass} duration-300`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const ScaleIn = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  return (
    <div 
      className="animate-in fade-in zoom-in duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Stagger children animations
export const StaggerContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
};
