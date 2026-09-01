import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";
import { cn } from "@linkwarden/lib/utils";
import { rawTheme, ThemeName } from "@/lib/colors";
import IconBadge from "@/components/ui/IconBadge";

type GroupProps = {
  title?: string;
  children: React.ReactNode;
};

/** A titled, rounded group of rows with hairline dividers between them. */
export function SettingsGroup({ title, children }: GroupProps) {
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View>
      {title ? (
        <Text className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wider text-neutral">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-2xl bg-base-200">
        {rows.map((row, i) => (
          <React.Fragment key={i}>
            {i > 0 ? (
              <View className="ml-[60px] h-px bg-neutral-content opacity-60" />
            ) : null}
            {row}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

type RowProps = {
  icon: React.ReactNode;
  /** Color for the tinted icon badge. */
  color: string;
  label: string;
  labelClassName?: string;
  description?: string;
  /** Element rendered at the trailing edge (value text, chevron, switch…). */
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function SettingsRow({
  icon,
  color,
  label,
  labelClassName,
  description,
  right,
  onPress,
  disabled,
}: RowProps) {
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      className="px-3.5 py-3"
      activeOpacity={0.6}
      disabled={disabled}
      onPress={onPress}
    >
      <View className="flex-row items-center gap-3">
        <IconBadge
          color={disabled ? theme.neutral : color}
          size={34}
          radius={10}
        >
          {icon}
        </IconBadge>
        <Text
          className={cn(
            "flex-1 text-base text-base-content",
            disabled && "text-neutral",
            labelClassName
          )}
          numberOfLines={1}
        >
          {label}
        </Text>
        {right}
      </View>
      {description ? (
        <Text className="ml-[46px] mt-1.5 text-sm leading-5 text-neutral">
          {description}
        </Text>
      ) : null}
    </Container>
  );
}
