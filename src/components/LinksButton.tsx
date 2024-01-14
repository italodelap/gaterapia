import { Button } from "@nextui-org/react";
import { Link } from "@nextui-org/react";

export function LinksButton() {
  return (
    <Button
      as={Link}
      radius="full"
      href="/links"
      className="text-white border-white border-1 bg-transparent hover:bg-none hover:scale-105"
      showAnchorIcon
    >
      Mis links
    </Button>
  );
}
