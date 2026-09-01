import React from "react";
import { View, ViewProps } from "react-native";
import { withAlpha } from "@/lib/colors";

type Props = ViewProps & {
  /** Base color; the background is a soft tint of it. */
  color: string;
  size?: number;
  /** Border radius. Defaults to a rounded square; pass `size / 2` for a circle. */
  radius?: number;
  /** Tint opacity for the background. */
  tint?: number;
  children: React.ReactNode;
};

/**
 * A softly tinted container for an icon — the small colored squares/circles
 * used in stat cards, list rows, section headers and empty states.
 */
export default function IconBadge({
  color,
  size = 40,
  radius,
  tint = 0.15,
  style,
  children,
  ...props
}: Props) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius ?? Math.round(size * 0.3),
          backgroundColor: withAlpha(color, tint),
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
