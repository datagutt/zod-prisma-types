import { DMMF } from '@prisma/generator-helper';
import {
  DATE_VALIDATOR_REGEX_MAP,
  NUMBER_VALIDATOR_REGEX_MAP,
  SPLIT_VALIDATOR_PATTERN_REGEX,
  STRING_VALIDATOR_REGEX_MAP,
  VALIDATOR_KEY_REGEX,
  VALIDATOR_TYPE_REGEX,
} from 'src/constants/regex';
import {
  PrismaScalarType,
  ValidatorFunctionMap,
  ValidatorFunctionOptions,
  KeyValueMap,
  ZodValidatorType,
  ZodValidatorTypeMap,
} from 'src/types';

import { FormattedNames } from './formattedNames';

/////////////////////////////////////////////////
// TYPES & INTERFACE
/////////////////////////////////////////////////

export interface Validator {
  customErrors?: string;
  pattern?: string;
}

/////////////////////////////////////////////////
// CONSTANTS
/////////////////////////////////////////////////

/**
 * Map zod validators to their corresponding prisma scalar types
 */
export const VALIDATOR_TYPE_MAP: ZodValidatorTypeMap = {
  string: ['String', 'DateTime'],
  number: ['Float', 'Int', 'Decimal'],
  date: ['DateTime'],
};

/////////////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////////////

export const validateRegexInMap = <TKeys extends string>(
  regexMap: KeyValueMap<TKeys, RegExp>,
  { pattern, key }: ValidatorFunctionOptions,
): string => {
  const regex = regexMap[key as TKeys];

  if (!regex) {
    throw new Error(`Could not find regex for validator ${key} in regexMap`);
  }

  const match = pattern.match(regex);

  if (!match) {
    throw new Error(
      `Could not match validator ${key} with validatorPattern ${pattern}`,
    );
  }

  return match[0];
};

export const VALIDATOR_MAP: ValidatorFunctionMap = {
  string: (options) => validateRegexInMap(STRING_VALIDATOR_REGEX_MAP, options),
  number: (options) => validateRegexInMap(NUMBER_VALIDATOR_REGEX_MAP, options),
  date: (options) => validateRegexInMap(DATE_VALIDATOR_REGEX_MAP, options),
};

/////////////////////////////////////////////////
// CLASS
/////////////////////////////////////////////////

export class DMMFField extends FormattedNames implements DMMF.Field {
  readonly kind: DMMF.Field['kind'];
  readonly name: DMMF.Field['name'];
  readonly isRequired: DMMF.Field['isRequired'];
  readonly isList: DMMF.Field['isList'];
  readonly isUnique: DMMF.Field['isUnique'];
  readonly isId: DMMF.Field['isId'];
  readonly isReadOnly: DMMF.Field['isReadOnly'];
  readonly type: DMMF.Field['type'];
  readonly dbNames?: DMMF.Field['dbNames'];
  readonly isGenerated: DMMF.Field['isGenerated'];
  readonly hasDefaultValue: DMMF.Field['hasDefaultValue'];
  readonly default?: DMMF.Field['default'];
  readonly relationToFields?: DMMF.Field['relationToFields'];
  readonly relationOnDelete?: DMMF.Field['relationOnDelete'];
  readonly relationName?: DMMF.Field['relationName'];
  readonly documentation?: DMMF.Field['documentation'];

  private _validatorRegexMatch?: RegExpMatchArray;
  private _zodValidatorType?: ZodValidatorType;

  readonly clearedDocumentation?: string;
  readonly zodValidatorString?: string;
  readonly zodCustomErrors?: string;

  constructor(field: DMMF.Field) {
    super(field.name);

    this.kind = field.kind;
    this.name = field.name;
    this.isRequired = field.isRequired;
    this.isList = field.isList;
    this.isUnique = field.isUnique;
    this.isId = field.isId;
    this.isReadOnly = field.isReadOnly;
    this.type = field.type;
    this.dbNames = field.dbNames;
    this.isGenerated = field.isGenerated;
    this.hasDefaultValue = field.hasDefaultValue;
    this.default = field.default;
    this.relationToFields = field.relationToFields;
    this.relationOnDelete = field.relationOnDelete;
    this.relationName = field.relationName;
    this.documentation = field.documentation;

    this._validatorRegexMatch = this._setValidatorRegexMatch();
    this._zodValidatorType = this._setZodValidatorType();

    this.clearedDocumentation = this._setClearedDocumentation();
    this.zodCustomErrors = this._setZodCustomErrors();
    this.zodValidatorString = this._setZodValidatorString();
  }

  // INITIALIZERS
  // ----------------------------------------------

  private _setValidatorRegexMatch() {
    if (!this.documentation) return;
    return this.documentation.match(VALIDATOR_TYPE_REGEX) ?? undefined;
  }

  private _setZodValidatorType() {
    const validatorType = this._validatorRegexMatch?.groups?.['type'];
    if (!validatorType) throw new Error('No validator type found');
    if (!this._isZodValidatorType(validatorType))
      throw new Error(
        `Validator '${validatorType}' is not valid for type '${this.type}'`,
      );
    return validatorType as ZodValidatorType;
  }

  private _setClearedDocumentation() {
    if (!this.documentation) return;
    return this.documentation.replace(VALIDATOR_TYPE_REGEX, '');
  }

  private _isZodValidatorType(validatorType: string) {
    return VALIDATOR_TYPE_MAP[validatorType as ZodValidatorType].includes(
      this.type as PrismaScalarType,
    );
  }

  private _setZodCustomErrors() {
    return this._validatorRegexMatch?.groups?.['customErrors'];
  }

  private _setZodValidatorString() {
    const pattern = this._validatorRegexMatch?.groups?.['validatorPattern'];

    if (!pattern) return;

    // If pattern consists of multiple validators (e.g. .min(1).max(10))
    // the pattern is split into an array for further processing
    const validatorList = pattern?.match(SPLIT_VALIDATOR_PATTERN_REGEX);

    if (!validatorList) {
      throw new Error(
        `no validators found in pattern: ${pattern} in field ${this.name}`,
      );
    }

    // Check if each validator in list is valid for the field type
    validatorList.forEach((pattern) => {
      const key = pattern.match(VALIDATOR_KEY_REGEX)?.groups?.['validatorKey'];

      if (!key)
        throw new Error(`no validator key found in field: ${this.name}`);

      if (!this._zodValidatorType)
        throw new Error(`No validator type set in field: ${this.name}`);

      return VALIDATOR_MAP[this._zodValidatorType]({ pattern, key });
    });

    return pattern;
  }
}
