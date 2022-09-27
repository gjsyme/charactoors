import { background, Center } from "@chakra-ui/react"
import { ReactNode } from "react"


export const ItemBox = ({
  children,
  backgroundColor
}: {
  children: ReactNode,
  backgroundColor?: string
}) => {

  return (
    <Center
      h="120px"
      w="120px"
      bgColor={backgroundColor ?? 'containerBg'}
      borderRadius="10px"
    >
      {children}
    </Center>
  )
}