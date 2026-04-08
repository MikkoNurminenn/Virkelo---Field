"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type PhoneListInputProps = {
  description?: string;
  label: string;
  name: string;
  values?: string[];
};

export function PhoneListInput({
  description,
  label,
  name,
  values = [],
}: PhoneListInputProps) {
  const [rows, setRows] = useState(values.length > 0 ? values : []);

  const updateRow = (index: number, value: string) => {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? value : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, ""]);
  };

  const removeRow = (index: number) => {
    setRows((current) => {
      if (current.length === 1) {
        return [];
      }

      return current.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-3">
        {rows.length > 0 ? (
          rows.map((value, index) => (
            <div className="flex items-center gap-2" key={`${name}-${index}`}>
              <Input
                autoComplete="tel"
                name={name}
                onChange={(event) => updateRow(index, event.target.value)}
                placeholder="Esim. 040 123 4567"
                type="tel"
                value={value}
              />
              <Button
                aria-label={`Poista numero ${index + 1}`}
                onClick={() => removeRow(index)}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            Numeroita ei tarvitse lisätä, ellei niille ole tarvetta.
          </div>
        )}
      </div>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <div className="flex justify-start">
        <Button onClick={addRow} size="sm" type="button" variant="outline">
          <PlusIcon className="size-4" />
          Lisää numero
        </Button>
      </div>
    </Field>
  );
}
