export const GetRandomColor = () => {
    const colors = [
      "#EF4444", // red
      "#F59E0B", // amber
      "#10B981", // emerald
      "#3B82F6", // blue
      "#8B5CF6", // violet
      "#EC4899", // pink
      "#6366F1", // indigo
      "#14B8A6", // teal
      "#F43F5E", // rose
      "#F97316", // orange
      "#22D3EE", // cyan
      "#A3E635", // lime
      "#FDE68A", // yellow
      "#D946EF", // fuchsia
      "#6EE7B7", // green
      "#FACC15", // gold
      "#EAB308", // yellow dark
      "#0EA5E9", // sky
      "#BE185D", // magenta
      "#7C3AED", // purple
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };