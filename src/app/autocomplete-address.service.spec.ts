import { TestBed } from '@angular/core/testing';

import { AutocompleteAddressService } from './autocomplete-address.service';

describe('AutocompleteAddressService', () => {
  let service: AutocompleteAddressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutocompleteAddressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
