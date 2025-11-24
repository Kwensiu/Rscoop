import { createSignal, createEffect, onCleanup, Show, Component } from "solid-js";
import { Minimize2 } from "lucide-solid";

interface MinimizedIndicatorProps {
  title: string;
  visible: boolean;
  onClick: () => void;
}

const MinimizedIndicator: Component<MinimizedIndicatorProps> = (props) => {
  return (
    <Show when={props.visible}>
      <div 
        class="fixed bottom-4 left-4 z-50 bg-base-200 rounded-lg shadow-lg border border-base-300 p-3 cursor-pointer transition-all duration-300 ease-in-out transform"
        classList={{
          "opacity-0 translate-y-full": !props.visible,
          "opacity-100 translate-y-0": props.visible,
        }}
        onClick={props.onClick}
      >
        <div class="flex items-center">
          <div class="font-medium text-sm truncate max-w-xs mr-2">
            {props.title}
          </div>
          <div class="flex items-center">
            <span class="loading loading-spinner loading-xs mr-1"></span>
            <Minimize2 class="w-4 h-4" />
          </div>
        </div>
      </div>
    </Show>
  );
};

export default MinimizedIndicator;