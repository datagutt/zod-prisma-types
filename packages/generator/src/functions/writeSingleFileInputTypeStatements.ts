import { type WriteStatements } from '../types';
import {
  writeNonScalarType,
  writeScalarType,
  writeSpecialType,
} from '../utils';

/////////////////////////////////////////////////
// FUNCTION
/////////////////////////////////////////////////

export const writeSingleFileInputTypeStatements: WriteStatements = (
  dmmf,
  { writer, writeHeading },
) => {
  writeHeading(`INPUT TYPES`, 'FAT');

  dmmf.schema.inputObjectTypes.prisma.forEach((inputType) => {
    // when an omit field is present, the type is not a native prism type
    // but a zod union of the native type and an omit type
    const type = inputType.hasOmitFields()
      ? `z.ZodType<Omit<PrismaClient.Prisma.${
          inputType.name
        }, ${inputType.getOmitFieldsUnion()}>>`
      : `z.ZodType<PrismaClient.Prisma.${inputType.name}>`;

    writer
      .blankLine()
      .write(`export const ${inputType.name}Schema: ${type} = `);

    writer.write(`z.object(`).inlineBlock(() => {
      inputType.fields.forEach((field) => {
        const {
          isNullable,
          isOptional,
          zodCustomErrors,
          zodValidatorString,
          zodCustomValidatorString,
        } = field;

        if (field.zodOmitField) {
          writer.write(`// omitted: `);
        }

        writer.write(`${field.name}: `);

        if (field.hasMultipleTypes) {
          writer.write(`z.union([ `);

          field.inputTypes.forEach((inputType, idx) => {
            const writeComma = idx !== field.inputTypes.length - 1;
            writeScalarType(writer, {
              inputType,
              zodCustomErrors,
              zodValidatorString,
              zodCustomValidatorString,
              writeComma,
              writeValidation: dmmf.addInputTypeValidation(),
            });
            writeNonScalarType(writer, {
              inputType,
              writeComma,
            });
            writeSpecialType(writer, {
              inputType,
              zodCustomErrors,
              zodCustomValidatorString,
              writeComma,
              writeValidation: dmmf.addInputTypeValidation(),
            });
          });

          writer
            .write(` ])`)
            .conditionalWrite(!field.isRequired, `.optional()`)
            .conditionalWrite(field.isNullable, `.nullable()`)
            .write(`,`);
        } else {
          const inputType = field.inputTypes[0];
          writeScalarType(writer, {
            inputType,
            isNullable,
            isOptional,
            zodCustomErrors,
            zodValidatorString,
            zodCustomValidatorString,
            writeValidation: dmmf.addInputTypeValidation(),
          });
          writeNonScalarType(writer, {
            inputType,
            isNullable,
            isOptional,
          });
          writeSpecialType(writer, {
            inputType,
            zodCustomErrors,
            zodCustomValidatorString,
            isNullable,
            isOptional,
            writeValidation: dmmf.addInputTypeValidation(),
          });
        }

        writer.newLine();
      });
    });

    writer.write(`).strict()`).blankLine();
  });
};
