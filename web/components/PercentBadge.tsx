import { Badge } from "@radix-ui/themes";

export function PercentBadge(props: {
  percent: number;
  highThreshold: number;
  lowThreshold: number;
  className?: string;
}) {
  return (
    <Badge 
      size="1" 
      color={props.percent >= props.highThreshold ? 'jade' : props.percent >= props.lowThreshold ? 'bronze' : 'gray'} 
      variant="solid" 
      className={props.className}
    >
      {`${Math.round(props.percent * 100)}%`}
    </Badge>
  )
}
