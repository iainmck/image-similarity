"use client";

import { usePathname } from "next/navigation";

import { Button, Text, Link, Flex } from "@radix-ui/themes";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:block min-w-50 p-4 border-r border-black/20">
      <Text size="3" weight="bold">Image Similarity</Text>
      <Flex direction="column" gap="2" mt="4">
        <Link href="/" style={{ display: 'block', width: '100%' }}>
          <Button 
            style={{ width: '100%' }}
            variant={pathname === "/" ? "solid" : "outline"}
          >
            Dropzone
          </Button>
        </Link>
        <Link href="/evaluation" style={{ display: 'block', width: '100%' }}>
          <Button 
            style={{ width: '100%' }}
            variant={pathname === "/evaluation" ? "solid" : "outline"}
          >
            Evaluation
          </Button>
        </Link>
      </Flex>
    </div>
  );
}
