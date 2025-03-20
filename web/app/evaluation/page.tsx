"use client"

import { useState } from "react";
import { ModelSelector } from "./selector";
import { EvaluationPageResults } from "./results";
import { Slider, Flex, Text } from "@radix-ui/themes"


export default function EvaluationPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const [highThreshold, setHighThreshold] = useState(0.9);
  const [lowThreshold, setLowThreshold] = useState(0.8);

  return (
    <Flex direction="column" className="h-full w-full">
      <ModelSelector onModelSelect={(model) => setSelectedModel(model)} />
      
      <Flex direction="row" gap="8">
        <Flex direction="column" gap="1" flexGrow="1">
          <Text size="1" weight="bold" color="gray">High confidence threshold</Text>
          <Slider value={[highThreshold]} onValueChange={([value]) => setHighThreshold(value)} min={0} max={1} step={0.01} />
          <Text size="1" weight="bold" color="gray">{Math.round(highThreshold * 100)}%</Text>
        </Flex>

        <Flex direction="column" gap="1" flexGrow="1" className="opacity-0">
          <Text size="1" weight="bold" color="gray">Low threshold</Text>
          <Slider value={[lowThreshold]} onValueChange={([value]) => setLowThreshold(value)} min={0} max={1} step={0.01} />
          <Text size="1" weight="bold" color="gray">{Math.round(lowThreshold * 100)}%</Text>
        </Flex>

        <Flex flexGrow="1" />
      </Flex>

      <EvaluationPageResults model={selectedModel} highThreshold={highThreshold} lowThreshold={lowThreshold} />
    </Flex>
  );
}
