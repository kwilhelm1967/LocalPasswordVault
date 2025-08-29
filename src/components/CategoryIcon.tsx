import React from "react";
import {
  Grid3X3,
  CircleDollarSign,
  ShoppingCart,
  Briefcase,
  Ticket,
  Mail,
  ChartNoAxesCombined,
  Folder,
  FileChartColumn,
} from "lucide-react";

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 16,
  className = "",
}) => {
  switch (name) {
    case "Grid3X3":
      return <Grid3X3 size={size} className={className} />;
    case "CircleDollarSign":
      return <CircleDollarSign size={size} className={className} />;
    case "ShoppingCart":
      return <ShoppingCart size={size} className={className} />;
    case "Ticket":
      return <Ticket size={size} className={className} />;
    case "Mail":
      return <Mail size={size} className={className} />;
    case "Briefcase":
      return <Briefcase size={size} className={className} />;
    case "TrendingUp":
      return <ChartNoAxesCombined size={size} className={className} />;
    case "FileText":
      return <FileChartColumn size={size} className={className} />;
    default:
      return <Folder size={size} className={className} />;
  }
};
