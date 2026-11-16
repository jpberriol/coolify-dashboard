import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

const CustomDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon: Icon,
  className = "",
  disabled = false,
}) => {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <ListboxButton className="relative w-full pl-10 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-white/10 transition text-left">
            {Icon && (
              <Icon className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDownIcon
                className="h-4 w-4 text-slate-300"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-slate-800 border border-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  className={({ active, selected }) =>
                    `relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${
                      active
                        ? "bg-slate-700 text-white"
                        : selected
                          ? "bg-slate-700/50 text-white"
                          : "text-slate-300 hover:bg-slate-700/30"
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
                          <CheckIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default CustomDropdown;
