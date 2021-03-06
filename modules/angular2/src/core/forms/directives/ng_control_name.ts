import {CONST_EXPR} from 'angular2/src/core/facade/lang';
import {EventEmitter, ObservableWrapper} from 'angular2/src/core/facade/async';
import {StringMap} from 'angular2/src/core/facade/collection';
import {OnChanges, OnDestroy} from 'angular2/lifecycle_hooks';
import {Query, Directive} from 'angular2/src/core/metadata';
import {forwardRef, Host, SkipSelf, Binding, Inject, Optional} from 'angular2/src/core/di';

import {ControlContainer} from './control_container';
import {NgControl} from './ng_control';
import {controlPath, isPropertyUpdated} from './shared';
import {Control} from '../model';
import {Validators, NG_VALIDATORS} from '../validators';


const controlNameBinding =
    CONST_EXPR(new Binding(NgControl, {toAlias: forwardRef(() => NgControlName)}));

/**
 * Creates and binds a control with a specified name to a DOM element.
 *
 * This directive can only be used as a child of {@link NgForm} or {@link NgFormModel}.

 * # Example
 *
 * In this example, we create the login and password controls.
 * We can work with each control separately: check its validity, get its value, listen to its
 changes.
 *
 *  ```
 * @Component({selector: "login-comp"})
 * @View({
 *      directives: [FORM_DIRECTIVES],
 *      template: `
 *              <form #f="form" (submit)='onLogIn(f.value)'>
 *                Login <input type='text' ng-control='login' #l="form">
 *                <div *ng-if="!l.valid">Login is invalid</div>
 *
 *                Password <input type='password' ng-control='password'>

 *                <button type='submit'>Log in!</button>
 *              </form>
 *      `})
 * class LoginComp {
 *  onLogIn(value) {
 *    // value === {login: 'some login', password: 'some password'}
 *  }
 * }
 *  ```
 *
 * We can also use ng-model to bind a domain model to the form.
 *
 *  ```
 * @Component({selector: "login-comp"})
 * @View({
 *      directives: [FORM_DIRECTIVES],
 *      template: `
 *              <form (submit)='onLogIn()'>
 *                Login <input type='text' ng-control='login' [(ng-model)]="credentials.login">
 *                Password <input type='password' ng-control='password'
 [(ng-model)]="credentials.password">
 *                <button type='submit'>Log in!</button>
 *              </form>
 *      `})
 * class LoginComp {
 *  credentials: {login:string, password:string};
 *
 *  onLogIn() {
 *    // this.credentials.login === "some login"
 *    // this.credentials.password === "some password"
 *  }
 * }
 *  ```
 */
@Directive({
  selector: '[ng-control]',
  bindings: [controlNameBinding],
  properties: ['name: ngControl', 'model: ngModel'],
  events: ['update: ngModel'],
  exportAs: 'form'
})
export class NgControlName extends NgControl implements OnChanges,
    OnDestroy {
  _parent: ControlContainer;
  update = new EventEmitter();
  model: any;
  viewModel: any;
  validators: Function[];
  _added = false;

  constructor(@Host() @SkipSelf() parent: ControlContainer,
              @Optional() @Inject(NG_VALIDATORS) validators: Function[]) {
    super();
    this._parent = parent;
    this.validators = validators;
  }

  onChanges(c: StringMap<string, any>) {
    if (!this._added) {
      this.formDirective.addControl(this);
      this._added = true;
    }
    if (isPropertyUpdated(c, this.viewModel)) {
      this.viewModel = this.model;
      this.formDirective.updateModel(this, this.model);
    }
  }

  onDestroy() { this.formDirective.removeControl(this); }

  viewToModelUpdate(newValue: any): void {
    this.viewModel = newValue;
    ObservableWrapper.callNext(this.update, newValue);
  }

  get path(): string[] { return controlPath(this.name, this._parent); }

  get formDirective(): any { return this._parent.formDirective; }

  get control(): Control { return this.formDirective.getControl(this); }

  get validator(): Function { return Validators.compose(this.validators); }
}
