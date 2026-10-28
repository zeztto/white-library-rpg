import { Component, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('게임 오류:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-foreground">게임 오류 발생</h1>
            <p className="text-muted-foreground">
              예상치 못한 오류가 발생했습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message}
            </p>
            <Button onClick={() => window.location.reload()}>
              게임 재시작
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
