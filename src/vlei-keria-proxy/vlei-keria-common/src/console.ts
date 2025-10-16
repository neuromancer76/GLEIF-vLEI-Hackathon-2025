class Ansi {
  // Text Colors
  static readonly BLACK = '\x1b[30m';
  static readonly RED = '\x1b[31m';
  static readonly GREEN = '\x1b[32m';
  static readonly YELLOW = '\x1b[33m';
  static readonly BLUE = '\x1b[34m';
  static readonly MAGENTA = '\x1b[35m';
  static readonly CYAN = '\x1b[36m';
  static readonly WHITE = '\x1b[37m';
  
  // Bright/Light versions
  static readonly BRIGHT_BLACK = '\x1b[90m';
  static readonly BRIGHT_RED = '\x1b[91m';
  static readonly BRIGHT_GREEN = '\x1b[92m';
  static readonly BRIGHT_YELLOW = '\x1b[93m';
  static readonly BRIGHT_BLUE = '\x1b[94m';
  static readonly BRIGHT_MAGENTA = '\x1b[95m';
  static readonly BRIGHT_CYAN = '\x1b[96m';
  static readonly BRIGHT_WHITE = '\x1b[97m';
  
  // Background colors
  static readonly BG_BLACK = '\x1b[40m';
  static readonly BG_RED = '\x1b[41m';
  static readonly BG_GREEN = '\x1b[42m';
  static readonly BG_YELLOW = '\x1b[43m';
  static readonly BG_BLUE = '\x1b[44m';
  static readonly BG_MAGENTA = '\x1b[45m';
  static readonly BG_CYAN = '\x1b[46m';
  static readonly BG_WHITE = '\x1b[47m';
  
  // Bright Background colors
  static readonly BG_BRIGHT_BLACK = '\x1b[100m';
  static readonly BG_BRIGHT_RED = '\x1b[101m';
  static readonly BG_BRIGHT_GREEN = '\x1b[102m';
  static readonly BG_BRIGHT_YELLOW = '\x1b[103m';
  static readonly BG_BRIGHT_BLUE = '\x1b[104m';
  static readonly BG_BRIGHT_MAGENTA = '\x1b[105m';
  static readonly BG_BRIGHT_CYAN = '\x1b[106m';
  static readonly BG_BRIGHT_WHITE = '\x1b[107m';
  
  // Styles
  static readonly BOLD = '\x1b[1m';
  static readonly UNDERLINE = '\x1b[4m';
  static readonly RESET = '\x1b[0m';
}

export function prTitle(message: string): void {
  console.log(`\n${Ansi.BOLD}${Ansi.UNDERLINE}${Ansi.BG_BLUE}${Ansi.BRIGHT_BLACK}  ${message}  ${Ansi.RESET}\n`);
}

export function prMessage(message: string): void {
  console.log(`\n${Ansi.BOLD}${Ansi.BRIGHT_BLUE}${message}${Ansi.RESET}\n`);
}

export function prSubTitle(message: string): void {
  const tabs = '\t\t\t'; // 3 tabs indentation
  console.log(`${tabs}${Ansi.BG_GREEN}${Ansi.YELLOW}${message}${Ansi.RESET}`);
}

export function prAlert(message: string): void {
  console.log(`\n${Ansi.BOLD}${Ansi.BG_YELLOW}${Ansi.BRIGHT_BLUE}${message}${Ansi.RESET}\n`);
}

export function prContinue(): void {
  const message = "  You can continue ✅  ";
  console.log(`\n${Ansi.BOLD}${Ansi.BG_GREEN}${Ansi.BRIGHT_BLACK}${message}${Ansi.RESET}\n\n`);
}