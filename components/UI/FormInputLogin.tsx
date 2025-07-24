"use client";

import { Field } from "formik";
import { CircleHelp } from "lucide-react";

export function FormInput({
  errors,
  touched,
  tooltip,
  name,
  placeholder,
  label,
  type,
  readonly,
}: {
  errors: string | undefined;
  touched: string | undefined;
  tooltip: string;
  name: string;
  placeholder: string;
  label: string;
  type?: string;
  readonly?: boolean;
}) {
  return (
    <div className="w-11/12 block ml-4 bg-transparent">
      <label className="form-control text-white  w-auto max-w-lg bg-transparent">
        <div className="label">
          <span className="label-text text-white font-bold gap-x-2 flex flex-row bg-transparent">
            {label}
            <span className="tooltip text-white tooltip-right bg-transparent" data-tip={tooltip}>
              <CircleHelp className=" my-auto" size={20} strokeWidth={0.75} />
            </span>
          </span>
        </div>
        <Field
          type={type}
          placeholder={placeholder}
          name={name}
          className={`input input-bordered text-black border-white w-auto max-w-md ${
            errors && touched ? "input-error" : ""
          }`}
          disabled={readonly}
        />
      </label>

      {errors && touched ? (
        <span className="text-error bg-transparent flex flex-row">{errors}</span>
      ) : <span className="text-error invisible bg-transparent flex flex-row">Error</span>}
    </div>
  );
}