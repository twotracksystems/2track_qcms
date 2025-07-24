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
  additionalClass
}: {
  errors: string | undefined;
  touched: string | undefined;
  tooltip: string;
  name: string;
  placeholder: string;
  label: string;
  type?: string;
  readonly?: boolean;
  additionalClass?: string;
}) {
  return (
    <div className="w-11/12 block ml-4 bg-white">
      <label className="form-control w-auto max-w-lg">
        <div className="label">
          <span className="label-text font-bold gap-x-2 flex flex-row">
            {label}
            <span className="tooltip tooltip-right" data-tip={tooltip}>
              <CircleHelp className=" my-auto" size={20} strokeWidth={0.75} />
            </span>
          </span>
        </div>
        <Field
          type={type}
          placeholder={placeholder}
          name={name}
          className={`input bg-white input-bordered w-auto max-w-md ${additionalClass} ${
            errors && touched ? "input-error" : ""
          }`}
          readOnly={readonly}
        />
      </label>

      {errors && touched ? (
        <span className="text-error  flex flex-row">{errors}</span>
      ) : <span className="text-error invisible flex flex-row">Error</span>}
    </div>
  );
}
export function FormTextArea({
  errors,
  touched,
  tooltip,
  name,
  placeholder,
  label,
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
<div className="w-11/12 block ml-4">
      <label className="form-control w-auto max-w-lg">
        <div className="label">
          <span className="label-text font-bold gap-x-2 flex flex-row">
            {label}
            <span className="tooltip tooltip-right" data-tip={tooltip}>
              <CircleHelp className=" my-auto" size={20} strokeWidth={0.75} />
            </span>
          </span>
        </div>
        <Field
          as="textarea"
          name={name}
          disabled={readonly}
          className={`textarea bg-white textarea-bordered w-auto max-w-md ${
            errors && touched ? "input-error" : ""
          } `}
          placeholder={placeholder}
        ></Field>
      </label>

      {errors && touched ? (
        <span className="text-error  flex flex-row">{errors}</span>
      ) : (
        <span className="text-error invisible flex flex-row">Error</span>
      )}
    </div>
  );
}
export function FormInputCheckBox({
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
    <div className="w-11/12 block ml-4">
      <label className="form-control w-auto max-w-lg">
        <div className="label">
          <span className="label-text font-bold gap-x-2 flex flex-row">
            {label}
            <span className="tooltip tooltip-right" data-tip={tooltip}>
              <CircleHelp className=" my-auto" size={20} strokeWidth={0.75} />
            </span>
          </span>
        </div>
        <Field
          type={type}
          placeholder={placeholder}
          name={name}
          className={`checkbox bg-white ${errors && touched ? "checkbox-error" : ""}`}
          disabled={readonly}
        />
      </label>

      {errors && touched ? (
        <span className="text-error  flex flex-row">{errors}</span>
      ) : (
        <span className="text-error invisible flex flex-row">Error</span>
      )}
    </div>
  );
}

export function DisplayFormData({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip: string;
}) {
  return (
    <div className="w-11/12 block ml-4">
      <label className="form-control w-auto max-w-lg">
        <div className="label">
          <span className="label-text font-bold gap-x-2 flex flex-row">
            {label}
            <span className="tooltip tooltip-right" data-tip={tooltip}>
              <CircleHelp className=" my-auto" size={20} strokeWidth={0.75} />
            </span>
          </span>
        </div>
        <div className="input bg-white input-bordered flex flex-row ">
          <span className=" my-auto">{value}</span>
        </div>
      </label>
    </div>
  );
}

export function FormSelect({
  errors,
  touched,
  tooltip,
  name,
  placeholder,
  label,
  readonly,
  options,
}: {
  errors: string | undefined;
  touched: string | undefined;
  tooltip: string;
  name: string;
  placeholder: string;
  label: string;
  type?: string;
  readonly?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="w-11/12 block ml-4">
      <label className="form-control w-auto max-w-lg">
        <div className="label">
          <span className="label-text font-bold gap-x-2 flex flex-row">
            {label}
            <span className="tooltip tooltip-right" data-tip={tooltip}>
              <CircleHelp className=" my-auto" size={20} strokeWidth={0.75} />
            </span>
          </span>
        </div>
        <Field
          as="select"
          name={name}
          className={`select bg-white select-bordered mx-auto w-full max-w-md ${
            errors && touched ? "select-error" : ""
          }`}
          disabled={readonly}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </Field>
      </label>

      {errors && touched ? (
        <span className="text-error  flex flex-row">{errors}</span>
      ) : (
        <span className="text-error invisible flex flex-row">Error</span>
      )}
    </div>
  );
}
