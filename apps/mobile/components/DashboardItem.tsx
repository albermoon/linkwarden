import { Text, View } from "react-native";
import IconBadge from "@/components/ui/IconBadge";

export default function DashboardItem({
  name,
  value,
  icon,
  color,
}: {
  name: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <View className="flex-1 flex-col gap-3 rounded-2xl bg-base-200 p-4">
      <IconBadge color={color} size={40} radius={12}>
        {icon}
      </IconBadge>
      <View>
        <Text
          className="text-3xl font-bold tracking-tight text-base-content"
          numberOfLines={1}
        >
          {value || 0}
        </Text>
        <Text className="mt-0.5 text-sm font-medium text-neutral">{name}</Text>
      </View>
    </View>
  );
}
