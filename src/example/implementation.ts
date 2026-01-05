import { ActiveEnum, } from "./source";
import { ActiveEnumWithUnusedValue } from "./index";

// NOTE - only implements ActiveEnum.yes
export function isActive(enumValue: ActiveEnum): boolean {
    return enumValue === ActiveEnum.yes;
}

// NOTE - only implements ActiveEnumWithUnusedValue.usedValue
export function isActiveWithUnusedValue(enumValue: ActiveEnumWithUnusedValue): boolean {
    return enumValue === ActiveEnumWithUnusedValue.usedValue;
}