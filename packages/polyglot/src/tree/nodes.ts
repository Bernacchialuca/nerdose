export type NodeId = `n${number}`;
export type Type = 'int' | 'int[]' | 'bool';
export type ScalarType = 'int' | 'bool';
export type Param = { readonly name: string; readonly type: Type };
export type Signature = { readonly params: readonly Type[]; readonly returns: ScalarType };

export type BinOp = '+' | '-' | '*' | '%' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||';
export type CompoundOp = '+=' | '-=' | '*=';

export type NumExpr = { readonly kind: 'num'; readonly id: NodeId; readonly value: number };
export type VarExpr = { readonly kind: 'var'; readonly id: NodeId; readonly name: string };
export type BoolExpr = { readonly kind: 'bool'; readonly id: NodeId; readonly value: boolean };
export type BinExpr = {
  readonly kind: 'bin';
  readonly id: NodeId;
  readonly op: BinOp;
  readonly left: Expr;
  readonly right: Expr;
};
export type HalfExpr = { readonly kind: 'half'; readonly id: NodeId; readonly expr: Expr };
export type CallExpr = {
  readonly kind: 'call';
  readonly id: NodeId;
  readonly name: string;
  readonly args: readonly Expr[];
};
export type IndexExpr = {
  readonly kind: 'index';
  readonly id: NodeId;
  readonly array: Expr;
  readonly index: Expr;
};
export type LenExpr = { readonly kind: 'len'; readonly id: NodeId; readonly array: Expr };
export type Expr =
  | NumExpr
  | VarExpr
  | BoolExpr
  | BinExpr
  | HalfExpr
  | CallExpr
  | IndexExpr
  | LenExpr;

export type LetStmt = {
  readonly kind: 'let';
  readonly id: NodeId;
  readonly name: string;
  readonly type?: Type;
  readonly expr: Expr;
};
export type AssignStmt = {
  readonly kind: 'assign';
  readonly id: NodeId;
  readonly name: string;
  readonly expr: Expr;
};
export type IncStmt = { readonly kind: 'inc'; readonly id: NodeId; readonly name: string };
export type CompoundStmt = {
  readonly kind: 'compound';
  readonly id: NodeId;
  readonly name: string;
  readonly op: CompoundOp;
  readonly expr: Expr;
};
export type StepStmt = IncStmt | CompoundStmt | AssignStmt;
export type ForStmt = {
  readonly kind: 'for';
  readonly id: NodeId;
  readonly init: LetStmt;
  readonly cond: Expr;
  readonly step: StepStmt;
  readonly body: readonly Stmt[];
};
export type WhileStmt = {
  readonly kind: 'while';
  readonly id: NodeId;
  readonly cond: Expr;
  readonly body: readonly Stmt[];
};
export type IfStmt = {
  readonly kind: 'if';
  readonly id: NodeId;
  readonly cond: Expr;
  readonly then: readonly Stmt[];
};
export type ReturnStmt = { readonly kind: 'return'; readonly id: NodeId; readonly expr: Expr };
export type Stmt =
  | LetStmt
  | AssignStmt
  | IncStmt
  | CompoundStmt
  | ForStmt
  | WhileStmt
  | IfStmt
  | ReturnStmt;

export type FuncNode = {
  readonly kind: 'func';
  readonly id: NodeId;
  readonly name: string;
  readonly params: readonly string[];
  readonly paramTypes?: readonly Type[];
  readonly returns?: ScalarType;
  readonly body: readonly Stmt[];
};
export type TreeNode = FuncNode | Stmt | Expr;
