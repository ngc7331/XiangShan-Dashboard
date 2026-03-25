{
  description = "nix devshell for npm";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = {nixpkgs, ...}: let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
  in {
    devShells.${system}.default = pkgs.mkShell {
      packages = with pkgs; [
        yarn
        nodejs
      ];
      shellHook = ''
        npm set prefix ./.npm-global
        export PATH=$PATH:./.npm-global/bin
        export NODE_PATH=./.npm-global/lib/node_modules
      '';
    };
  };
}
